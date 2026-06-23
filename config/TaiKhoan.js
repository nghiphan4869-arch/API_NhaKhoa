const express = require('express');
const router = express.Router();
const db = require('../CSDL');

//Đăng ký
router.post('/dang-ky',(req,res)=>{
    const {
        MatKhau,
        HoTen,
        Email,
        SDT
    } = req.body;

    db.query(
        `INSERT INTO taikhoan
        (MaVaiTro,MatKhau,TrangThai)
        VALUES(1,?, 'HoatDong')`,
        [MatKhau],
        (err,result)=>{

            if(err) {
                console.error('Lỗi đăng ký tài khoản:', err);
                return res.status(500).json(err);
            }

            const maTK = result.insertId;

            db.query(
                `INSERT INTO benhnhan
                (MaTaiKhoan,HoTen,Email,SDT)
                VALUES(?,?,?,?)`,
                [maTK,HoTen,Email,SDT]
            );

            res.json({
                message:'Đăng ký thành công'
            });
        }
    );
});

//Đăng nhập
router.post('/dang-nhap',(req,res)=>{
    db.query(
        `SELECT tk.*, bn.MaBenhNhan, bn.HoTen, bn.Email, bn.SDT, bn.NgaySinh, bn.GioiTinh, bn.DiaChi
         FROM taikhoan tk
         LEFT JOIN benhnhan bn ON tk.MaTaiKhoan = bn.MaTaiKhoan
         WHERE (bn.Email=? OR bn.SDT=?)
         AND tk.MatKhau=?`,
        [
            req.body.TenDangNhap,
            req.body.TenDangNhap,
            req.body.MatKhau
        ],
        (err,result)=>{
            if (err) {
                console.error('Lỗi truy vấn đăng nhập:', err);
                return res.status(500).json(err);
            }
            res.json(result);
        }
    );
});

//Quên mk
router.post('/quen-mat-khau',(req,res)=>{
    const otp = Math.floor(
        100000 + Math.random()*900000
    );

    db.query(
        `UPDATE taikhoan
         SET OTP=?
         WHERE MaTaiKhoan = (
             SELECT MaTaiKhoan 
             FROM benhnhan 
             WHERE Email=? OR SDT=?
         )`,
        [
            otp,
            req.body.TenDangNhap,
            req.body.TenDangNhap
        ]
    );

    res.json({
        OTP:otp
    });
});

//Đặt lại mật khẩu
router.put('/dat-lai-mat-khau',(req,res)=>{
    db.query(
        `UPDATE taikhoan
         SET MatKhau=?
         WHERE MaTaiKhoan = (
             SELECT MaTaiKhoan 
             FROM benhnhan 
             WHERE Email=? OR SDT=?
         )`,
        [
            req.body.MatKhauMoi,
            req.body.TenDangNhap,
            req.body.TenDangNhap
        ]
    );
    res.json({
        message:'Đổi mật khẩu thành công'
    });
});

//Đổi mật khẩu (Đăng nhập rồi)
router.put('/doi-mat-khau', (req, res) => {
    const { MaTaiKhoan, MatKhauCu, MatKhauMoi } = req.body;

    if (!MaTaiKhoan || !MatKhauCu || !MatKhauMoi) {
        return res.status(400).json({ message: 'Thiếu thông tin yêu cầu đổi mật khẩu' });
    }

    db.query(
        `SELECT MatKhau FROM taikhoan WHERE MaTaiKhoan = ?`,
        [MaTaiKhoan],
        (err, result) => {
            if (err) {
                console.error('Lỗi kiểm tra mật khẩu cũ:', err);
                return res.status(500).json(err);
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'Tài khoản không tồn tại' });
            }

            if (result[0].MatKhau !== MatKhauCu) {
                return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
            }

            db.query(
                `UPDATE taikhoan SET MatKhau = ? WHERE MaTaiKhoan = ?`,
                [MatKhauMoi, MaTaiKhoan],
                (err2, result2) => {
                    if (err2) {
                        console.error('Lỗi cập nhật mật khẩu mới:', err2);
                        return res.status(500).json(err2);
                    }
                    res.json({ message: 'Đổi mật khẩu thành công' });
                }
            );
        }
    );
});

module.exports = router;