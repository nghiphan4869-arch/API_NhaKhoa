const express = require('express');
const router = express.Router();
const db = require('../CSDL');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer để lưu file avatar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'public/uploads/';
    // Tự động tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Lấy danh sách bệnh nhân
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT MaBenhNhan, MaTaiKhoan, HoTen, Email, SDT, NgaySinh, GioiTinh, DiaChi, HinhAnh
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

// Upload ảnh đại diện của bệnh nhân
router.post('/:id/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const maBenhNhan = req.params.id;
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh để tải lên' });
    }

    const hinhAnhUrl = `/public/uploads/${req.file.filename}`;

    // Cập nhật đường dẫn vào database cho bệnh nhân
    await db.query(
      'UPDATE benhnhan SET HinhAnh = ? WHERE MaBenhNhan = ?',
      [hinhAnhUrl, maBenhNhan]
    );

    res.json({
      message: 'Tải ảnh đại diện thành công',
      hinhAnh: hinhAnhUrl
    });
  } catch (error) {
    console.error('Lỗi upload avatar:', error);
    res.status(500).json({ message: 'Lỗi tải ảnh đại diện lên server', error: error.message });
  }
});

module.exports = router;
