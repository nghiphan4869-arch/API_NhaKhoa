const express = require('express');
const router = express.Router();
const db = require('../CSDL');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


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

// Store for OTPs in-memory
const otpStore = new Map();

//Quên mk - Gửi OTP về Gmail thật (Lưu OTP trong memory)
router.post('/quen-mat-khau', (req, res) => {
    const { Email } = req.body;
    if (!Email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email' });
    }

    db.query(
        `SELECT MaTaiKhoan FROM benhnhan WHERE Email = ?`,
        [Email],
        (err, result) => {
            if (err) {
                console.error('Lỗi tìm email:', err);
                return res.status(500).json(err);
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
            }

            const otp = Math.floor(100000 + Math.random() * 900000);
            const expires = Date.now() + 2 * 60 * 1000; // 2 phút

            // Lưu OTP vào memory store thay vì database
            otpStore.set(Email, { otp, expires });

            // Gửi email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: Email,
                subject: '[DentalCare] Mã xác thực OTP đặt lại mật khẩu',
                text: `Xin chào,\n\nMã xác thực OTP của bạn là: ${otp}\nMã này dùng để đặt lại mật khẩu tài khoản DentalCare của bạn. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nĐội ngũ DentalCare.`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Lỗi gửi email:', error);
                    otpStore.delete(Email); // Xóa OTP khỏi store nếu lỗi
                    return res.status(500).json({ message: 'Không thể gửi email OTP', error: error.message });
                }
                res.json({ message: 'Mã OTP đã được gửi về Gmail của bạn.' });
            });
        }
    );
});

// Xác thực OTP (Kiểm tra trong memory)
router.post('/xac-thuc-otp', (req, res) => {
    const { Email, OTP } = req.body;
    if (!Email || !OTP) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const record = otpStore.get(Email);
    if (!record) {
        return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn hoặc không tồn tại' });
    }

    if (Date.now() > record.expires) {
        otpStore.delete(Email);
        return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn' });
    }

    if (record.otp == OTP) {
        otpStore.delete(Email); // Xóa mã OTP sau khi xác thực thành công
        res.json({ success: true, message: 'Xác thực thành công' });
    } else {
        res.status(400).json({ success: false, message: 'Mã OTP không chính xác' });
    }
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