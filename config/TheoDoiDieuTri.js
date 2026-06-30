const express = require('express');
const router = express.Router();
const db = require('../CSDL');

// Gửi phản hồi theo dõi điều trị
router.put('/phan-hoi/:id', async (req, res) => {
  const { MucDoDau, TinhTrangSauDungThuoc, PhanHoiBenhNhan } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE theodoi_dieutri
       SET MucDoDau = ?, TinhTrangSauDungThuoc = ?, PhanHoiBenhNhan = ?
       WHERE MaTheoDoi = ?`,
      [MucDoDau, TinhTrangSauDungThuoc, PhanHoiBenhNhan, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu theo dõi' });
    }

    res.json({ message: 'Gửi phản hồi thành công' });
  } catch (error) {
    console.error('Lỗi gửi phản hồi:', error);
    res.status(500).json({ message: 'Lỗi gửi phản hồi', error: error.message });
  }
});

// Lấy theo dõi điều trị theo mã bệnh án
router.get('/:maBenhAn', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM theodoi_dieutri
       WHERE MaBenhAn = ?
       ORDER BY MaTheoDoi DESC`,
      [req.params.maBenhAn]
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy theo dõi điều trị:', error);
    res.status(500).json({ message: 'Lỗi lấy theo dõi điều trị', error: error.message });
  }
});

// Lấy hoặc tạo phiếu theo dõi sức khỏe cho lịch hẹn đã hoàn thành
router.post('/lich-hen/:maLichHen', async (req, res) => {
  try {
    // 1. Lấy thông tin lịch hẹn
    const [lichHens] = await db.query(
      `SELECT MaBenhNhan, NgayHen FROM lichhen WHERE MaLichHen = ? AND TrangThai = 'DaHoanThanh'`,
      [req.params.maLichHen]
    );

    if (lichHens.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn đã hoàn thành' });
    }

    const { MaBenhNhan, NgayHen } = lichHens[0];

    // 2. Tìm bệnh án của bệnh nhân (ưu tiên ngày lập trùng ngày hẹn, nếu không thì lấy bệnh án mới nhất)
    let [benhAns] = await db.query(
      'SELECT MaBenhAn FROM benhan WHERE MaBenhNhan = ? AND NgayLap = ?',
      [MaBenhNhan, NgayHen]
    );

    if (benhAns.length === 0) {
      // Lấy bệnh án mới nhất
      [benhAns] = await db.query(
        'SELECT MaBenhAn FROM benhan WHERE MaBenhNhan = ? ORDER BY MaBenhAn DESC LIMIT 1',
        [MaBenhNhan]
      );
    }

    // Nếu vẫn chưa có bệnh án nào, tự động tạo mới một bệnh án mặc định để liên kết
    if (benhAns.length === 0) {
      const [insertBenhAn] = await db.query(
        `INSERT INTO benhan (MaBenhNhan, ChanDoan, KetQuaDieuTri, NgayLap)
         VALUES (?, 'Khám tổng quát và điều trị', 'Đang theo dõi', ?)`,
        [MaBenhNhan, NgayHen]
      );
      benhAns = [{ MaBenhAn: insertBenhAn.insertId }];
    }

    const maBenhAn = benhAns[0].MaBenhAn;

    // 3. Kiểm tra xem đã có phiếu theo dõi sức khỏe cho bệnh án này chưa
    const [theoDois] = await db.query(
      'SELECT * FROM theodoi_dieutri WHERE MaBenhAn = ? LIMIT 1',
      [maBenhAn]
    );

    if (theoDois.length > 0) {
      return res.json(theoDois[0]);
    }

    // 4. Nếu chưa có, tạo mới phiếu theo dõi sức khỏe
    const [insertResult] = await db.query(
      'INSERT INTO theodoi_dieutri (MaBenhAn, MucDoDau, TinhTrangSauDungThuoc, PhanHoiBenhNhan) VALUES (?, NULL, NULL, NULL)',
      [maBenhAn]
    );

    const newId = insertResult.insertId;
    const [newTheoDois] = await db.query(
      'SELECT * FROM theodoi_dieutri WHERE MaTheoDoi = ?',
      [newId]
    );

    res.json(newTheoDois[0]);
  } catch (error) {
    console.error('Lỗi lấy/tạo phiếu theo dõi:', error);
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
});

module.exports = router;
