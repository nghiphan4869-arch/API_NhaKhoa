const express = require('express');
const router = express.Router();
const db = require('../CSDL');

// Lấy danh sách dịch vụ hoạt động
router.get('/', (req, res) => {
    db.query(
        `SELECT MaDichVu, TenDichVu, DonGia, MoTa, ThoiGian 
         FROM dichvu 
         WHERE TrangThai = 'HoatDong'`,
        (err, result) => {
            if (err) {
                console.error('Lỗi lấy danh sách dịch vụ:', err);
                return res.status(500).json(err);
            }
            res.json(result);
        }
    );
});

module.exports = router;
