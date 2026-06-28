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

// Đặt lịch hẹn
router.post('/', async (req, res) => {
  const { MaBenhNhan, MaBacSi, NgayHen, GioHen, LyDoKham } = req.body;

  if (!MaBenhNhan || !MaBacSi || !NgayHen || !GioHen || !LyDoKham) {
    return res.status(400).json({
      message: 'Vui lòng nhập MaBenhNhan, MaBacSi, NgayHen, GioHen, LyDoKham'
    });
  }

  try {
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

    const [insertResult] = await db.query(
      `INSERT INTO lichhen
       (MaBenhNhan, MaBacSi, NgayHen, GioHen, LyDoKham, HinhThucDat, TrangThai)
       VALUES (?, ?, ?, ?, ?, 'App', 'ChoDuyet')`,
      [MaBenhNhan, MaBacSi, NgayHen, GioHen, LyDoKham]
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
      `SELECT * FROM lichhen
       WHERE MaBenhNhan = ?
       ORDER BY NgayHen DESC, GioHen DESC`,
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
      `SELECT * FROM lichhen
       WHERE MaBacSi = ?
       ORDER BY NgayHen DESC, GioHen DESC`,
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
    const [result] = await db.query(
      `UPDATE lichhen
       SET TrangThai = 'DaHuy'
       WHERE MaLichHen = ? AND TrangThai = 'ChoDuyet'`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch chờ duyệt để hủy' });
    }

    res.json({ message: 'Đã hủy lịch' });
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
