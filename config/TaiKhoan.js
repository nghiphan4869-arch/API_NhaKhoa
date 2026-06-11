const express = require('express');
const router = express.Router();
const db = require('../CSDL');

router.post('/dang-ky',(req,res)=>{

    const {
        TenDangNhap,
        MatKhau,
        HoTen,
        Email,
        SDT
    } = req.body;

    db.query(
        `INSERT INTO taikhoan
        (MaVaiTro,TenDangNhap,MatKhau,TrangThai)
        VALUES(1,?,?, 'HoatDong')`,
        [TenDangNhap,MatKhau],
        (err,result)=>{

            if(err) return res.json(err);

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

router.post('/dang-nhap',(req,res)=>{

    db.query(
        `SELECT *
         FROM taikhoan
         WHERE TenDangNhap=?
         AND MatKhau=?`,
        [
            req.body.TenDangNhap,
            req.body.MatKhau
        ],
        (err,result)=>{
            res.json(result);
        }
    );
});

router.post('/quen-mat-khau',(req,res)=>{

    const otp = Math.floor(
        100000 + Math.random()*900000
    );

    db.query(
        `UPDATE taikhoan
         SET OTP=?
         WHERE TenDangNhap=?`,
        [
            otp,
            req.body.TenDangNhap
        ]
    );

    res.json({
        OTP:otp
    });

});

router.put('/dat-lai-mat-khau',(req,res)=>{

    db.query(
        `UPDATE taikhoan
        SET MatKhau=?
        WHERE TenDangNhap=?`,
        [
            req.body.MatKhauMoi,
            req.body.TenDangNhap
        ]
    );

    res.json({
        message:'Đổi mật khẩu thành công'
    });

});

module.exports = router;