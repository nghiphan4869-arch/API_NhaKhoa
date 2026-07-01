const express = require('express');
const router = express.Router();
const db = require('../CSDL');

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  const hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  return hour * 60 + minute;
}

function getServiceName(lyDoKham) {
  return String(lyDoKham || '').split(':')[0].trim();
}

// Middleware tự động cập nhật các lịch hẹn quá hạn sang 'DaHetHan'
const autoUpdateExpired = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE lichhen
       SET TrangThai = 'DaHetHan'
       WHERE (NgayHen < CURRENT_DATE OR (NgayHen = CURRENT_DATE AND GioHen < CURRENT_TIME))
         AND TrangThai NOT IN ('DaHoanTat', 'DaHuy', 'DaHetHan')`
    );
  } catch (error) {
    console.error('Lỗi tự động cập nhật lịch hẹn hết hạn:', error);
  }
  next();
};

router.use(autoUpdateExpired);

// Lấy danh sách bác sĩ rảnh trong ngày
router.get('/bacsi-ranh', async (req, res) => {
  const { ngay } = req.query; // YYYY-MM-DD
  if (!ngay) {
    return res.status(400).json({ message: 'Vui lòng cung cấp ngày' });
  }

  try {
    // 1. Kiểm tra xem ngày này có bác sĩ nào đăng ký lịch trong dangky_lich hay không
    const [hasSchedule] = await db.query(
      `SELECT COUNT(*) AS count FROM dangky_lich WHERE NgayLamViec = ?`,
      [ngay]
    );

    let doctors = [];
    if (hasSchedule[0].count > 0) {
      // Nếu có đăng ký lịch: chỉ lấy các bác sĩ có đăng ký lịch làm việc "Trong" vào ngày đó
      const [rows] = await db.query(
        `SELECT DISTINCT nv.MaNhanVien, nv.HoTen, nv.ChuyenMon 
         FROM nhanvien nv
         INNER JOIN dangky_lich dl ON nv.MaNhanVien = dl.MaBacSi
         WHERE nv.ChucVu = 'BacSi' 
           AND (nv.TrangThai IS NULL OR nv.TrangThai != 'NghiViec')
           AND dl.NgayLamViec = ? 
           AND dl.TrangThai = 'Trong'`,
        [ngay]
      );
      doctors = rows;
    } else {
      // Nếu không có ai đăng ký lịch trên dangky_lich cho ngày này:
      // Mặc định lấy tất cả bác sĩ đang làm việc
      const [rows] = await db.query(
        `SELECT MaNhanVien, HoTen, ChuyenMon 
         FROM nhanvien 
         WHERE ChucVu = 'BacSi' AND (TrangThai IS NULL OR TrangThai != 'NghiViec')`
      );
      doctors = rows;
    }

    // 2. Với mỗi bác sĩ, đếm số lịch hẹn hoạt động trong ngày đó
    const listBacSiRanh = [];
    for (const doc of doctors) {
      const [countResult] = await db.query(
        `SELECT COUNT(*) as count FROM lichhen 
         WHERE MaBacSi = ? AND NgayHen = ? AND TrangThai != 'DaHuy'`,
        [doc.MaNhanVien, ngay]
      );
      const count = countResult[0].count;
      // Bác sĩ rảnh nếu có ít hơn 12 lịch hẹn trong ngày
      if (count < 12) {
        listBacSiRanh.push({
          MaNhanVien: doc.MaNhanVien,
          HoTen: doc.HoTen,
          ChuyenMon: doc.ChuyenMon,
          SoLichHen: count
        });
      }
    }

    res.json(listBacSiRanh);
  } catch (error) {
    console.error('Lỗi lấy danh sách bác sĩ rảnh:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách bác sĩ rảnh', error: error.message });
  }
});

// Đặt lịch hẹn
router.post('/', async (req, res) => {
  const { MaBenhNhan, MaBacSi, NgayHen, GioHen, LyDoKham } = req.body;

  if (!MaBenhNhan || !MaBacSi || !NgayHen || !LyDoKham) {
    return res.status(400).json({
      message: 'Vui lòng nhập MaBenhNhan, MaBacSi, NgayHen, LyDoKham'
    });
  }

  try {
    if (GioHen) {
      const [services] = await db.query('SELECT TenDichVu, ThoiGian FROM dichvu');

      const serviceDurations = {};
      services.forEach((service) => {
        serviceDurations[service.TenDichVu] = Number(service.ThoiGian) || 30;
      });

      const newServiceName = getServiceName(LyDoKham);
      const newDuration = serviceDurations[newServiceName] || 30;
      const newStart = timeToMinutes(GioHen);
      const newEnd = newStart + newDuration;

      const [appointments] = await db.query(
        `SELECT *
         FROM lichhen
         WHERE NgayHen = ? AND TrangThai != 'DaHuy'`,
        [NgayHen]
      );

      for (const appointment of appointments) {
        if (!appointment.GioHen) continue;
        const oldStart = timeToMinutes(appointment.GioHen);
        const oldServiceName = getServiceName(appointment.LyDoKham);
        const oldDuration = serviceDurations[oldServiceName] || 30;
        const oldEnd = oldStart + oldDuration;

        const hasOverlap = newStart < oldEnd && oldStart < newEnd;

        if (!hasOverlap) continue;

        if (Number(appointment.MaBacSi) === Number(MaBacSi)) {
          return res.status(400).json({
            error: 'Trùng lịch',
            message: 'Bác sĩ đã có lịch hẹn trong khung giờ này.'
          });
        }

        if (Number(appointment.MaBenhNhan) === Number(MaBenhNhan)) {
          return res.status(400).json({
            error: 'Trùng lịch bệnh nhân',
            message: 'Bạn đã có lịch hẹn khác trùng/giao với khung giờ này.'
          });
        }
      }
    }

    const [insertResult] = await db.query(
      `INSERT INTO lichhen
       (MaBenhNhan, MaBacSi, NgayHen, GioHen, LyDoKham, HinhThucDat, TrangThai)
       VALUES (?, ?, ?, ?, ?, 'App', 'ChoDuyet')`,
      [MaBenhNhan, MaBacSi, NgayHen, GioHen || null, LyDoKham]
    );

    res.status(201).json({
      message: 'Đặt lịch thành công',
      MaLichHen: insertResult.insertId
    });
  } catch (error) {
    console.error('Lỗi đặt lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi đặt lịch hẹn', error: error.message });
  }
});

// Lấy lịch hẹn theo mã bệnh nhân
router.get('/benhnhan/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT lh.*, nv.HoTen AS TenBacSi 
       FROM lichhen lh
       LEFT JOIN nhanvien nv ON lh.MaBacSi = nv.MaNhanVien
       WHERE lh.MaBenhNhan = ?
       ORDER BY lh.NgayHen DESC, lh.GioHen DESC`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy lịch hẹn bệnh nhân:', error);
    res.status(500).json({ message: 'Lỗi lấy lịch hẹn bệnh nhân', error: error.message });
  }
});

// Lấy lịch hẹn theo mã bác sĩ
router.get('/bacsi/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT lh.*, nv.HoTen AS TenBacSi
       FROM lichhen lh
       LEFT JOIN nhanvien nv ON lh.MaBacSi = nv.MaNhanVien
       WHERE lh.MaBacSi = ?
       ORDER BY lh.NgayHen DESC, lh.GioHen DESC`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy lịch hẹn bác sĩ:', error);
    res.status(500).json({ message: 'Lỗi lấy lịch hẹn bác sĩ', error: error.message });
  }
});

// Hủy lịch hẹn
router.put('/huy/:id', async (req, res) => {
  try {
    // 1. Lấy thông tin lịch hẹn trước khi hủy
    const [appointments] = await db.query(
      'SELECT MaBenhNhan, NgayHen, GioHen FROM lichhen WHERE MaLichHen = ?',
      [req.params.id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    const appointment = appointments[0];
    const maBenhNhan = appointment.MaBenhNhan;

    // Định dạng ngày hẹn DD/MM/YYYY
    let ngayHenStr = '';
    try {
      const dateObj = new Date(appointment.NgayHen);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      ngayHenStr = `${day}/${month}/${year}`;
    } catch (_) {
      ngayHenStr = appointment.NgayHen;
    }

    // Định dạng giờ hẹn HH:MM
    let gioHenStr = appointment.GioHen;
    if (gioHenStr && gioHenStr.length > 5) {
      gioHenStr = gioHenStr.substring(0, 5);
    }

    // 2. Cập nhật trạng thái hủy
    const [result] = await db.query(
      `UPDATE lichhen
       SET TrangThai = 'DaHuy'
       WHERE MaLichHen = ? AND TrangThai = 'ChoDuyet'`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Lịch hẹn đã được duyệt hoặc đã bị hủy, không thể hủy tiếp' });
    }

    // 3. Thêm thông báo hủy lịch vào bảng thongbao
    await db.query(
      `INSERT INTO thongbao (MaBenhNhan, TieuDe, NoiDung, DaDoc)
       VALUES (?, ?, ?, 0)`,
      [
        maBenhNhan,
        'Lịch hẹn đã hủy',
        `Lịch hẹn vào lúc ${gioHenStr} ngày ${ngayHenStr} của bạn đã được hủy thành công.`
      ]
    );

    res.json({ message: 'Đã hủy lịch và tạo thông báo thành công' });
  } catch (error) {
    console.error('Lỗi hủy lịch:', error);
    res.status(500).json({ message: 'Lỗi hủy lịch', error: error.message });
  }
});

// Lấy lịch hẹn theo mã lịch hẹn
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM lichhen WHERE MaLichHen = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Lỗi lấy lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi lấy lịch hẹn', error: error.message });
  }
});

module.exports = router;
