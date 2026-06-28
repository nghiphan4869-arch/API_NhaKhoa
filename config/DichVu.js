const express = require('express');
const router = express.Router();
const db = require('../CSDL');

// Lấy danh sách dịch vụ hoạt động
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT MaDichVu, TenDichVu, DonGia, MoTa, ThoiGian
       FROM dichvu
       WHERE TrangThai = 'HoatDong'
       ORDER BY MaDichVu DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy danh sách dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách dịch vụ', error: error.message });
  }
});

module.exports = router;
