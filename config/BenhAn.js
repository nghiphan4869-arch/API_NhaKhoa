const express = require('express');
const router = express.Router();
const db = require('../CSDL');

// Lấy bệnh án theo mã bệnh nhân
router.get('/benhnhan/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM benhan
       WHERE MaBenhNhan = ?
       ORDER BY MaBenhAn DESC`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy bệnh án theo bệnh nhân:', error);
    res.status(500).json({ message: 'Lỗi lấy bệnh án', error: error.message });
  }
});

// Lấy bệnh án theo mã bệnh án
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM benhan WHERE MaBenhAn = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bệnh án' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Lỗi lấy bệnh án:', error);
    res.status(500).json({ message: 'Lỗi lấy bệnh án', error: error.message });
  }
});

module.exports = router;
