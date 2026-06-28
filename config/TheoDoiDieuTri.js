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

module.exports = router;
