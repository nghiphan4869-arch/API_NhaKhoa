const express = require('express');
const router = express.Router();
const db = require('../CSDL');

// Lấy đơn thuốc theo mã bệnh án
router.get('/:maBenhAn', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          dt.MaDonThuoc,
          dt.NgayKeDon,
          t.TenThuoc,
          ct.SoLuong,
          ct.CachDung
       FROM donthuoc dt
       JOIN chitiet_donthuoc ct ON dt.MaDonThuoc = ct.MaDonThuoc
       JOIN thuoc t ON t.MaThuoc = ct.MaThuoc
       WHERE dt.MaBenhAn = ?`,
      [req.params.maBenhAn]
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy đơn thuốc:', error);
    res.status(500).json({ message: 'Lỗi lấy đơn thuốc', error: error.message });
  }
});

module.exports = router;
