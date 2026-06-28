const express = require('express');
const router = express.Router();
const db = require('../CSDL');

// Lấy danh sách bệnh nhân
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT MaBenhNhan, MaTaiKhoan, HoTen, Email, SDT, NgaySinh, GioiTinh, DiaChi
       FROM benhnhan
       ORDER BY MaBenhNhan DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Lỗi lấy danh sách bệnh nhân:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách bệnh nhân', error: error.message });
  }
});

// Lấy bệnh nhân theo mã
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM benhnhan WHERE MaBenhNhan = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Lỗi lấy bệnh nhân:', error);
    res.status(500).json({ message: 'Lỗi lấy bệnh nhân', error: error.message });
  }
});

// Cập nhật thông tin bệnh nhân
router.put('/:id', async (req, res) => {
  const { HoTen, Email, SDT, NgaySinh, GioiTinh, DiaChi } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE benhnhan
       SET HoTen = ?, Email = ?, SDT = ?, NgaySinh = ?, GioiTinh = ?, DiaChi = ?
       WHERE MaBenhNhan = ?`,
      [HoTen, Email, SDT, NgaySinh || null, GioiTinh || null, DiaChi, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bệnh nhân để cập nhật' });
    }

    res.json({ message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật bệnh nhân:', error);
    res.status(500).json({ message: 'Lỗi cập nhật bệnh nhân', error: error.message });
  }
});

module.exports = router;
