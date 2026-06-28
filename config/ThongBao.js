const express = require('express');
const router = express.Router();
const db = require('../CSDL');

// Lấy thông báo theo mã bệnh nhân nếu bảng thongbao tồn tại
router.get('/benhnhan/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM thongbao
       WHERE MaBenhNhan = ?
       ORDER BY MaThongBao DESC`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy thông báo:', error);
    res.status(500).json({ message: 'Lỗi lấy thông báo', error: error.message });
  }
});

// Route test riêng cho thông báo
router.get('/', (req, res) => {
  res.json({ message: 'API thông báo đang chạy' });
});

module.exports = router;
