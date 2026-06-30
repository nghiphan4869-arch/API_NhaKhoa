const express = require('express');
const router = express.Router();
const db = require('../CSDL');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Đăng ký bệnh nhân
router.post('/dang-ky', async (req, res) => {
  const { MatKhau, HoTen, Email, SDT, NgaySinh, GioiTinh, DiaChi } = req.body;

  if (!MatKhau || !HoTen || (!Email && !SDT)) {
    return res.status(400).json({
      message: 'Vui lòng nhập MatKhau, HoTen và Email hoặc SDT'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [oldUser] = await connection.query(
      'SELECT MaBenhNhan FROM benhnhan WHERE Email = ? OR SDT = ?',
      [Email || '', SDT || '']
    );

    if (oldUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã tồn tại' });
    }

    const [accountResult] = await connection.query(
      `INSERT INTO taikhoan (MaVaiTro, MatKhau, TrangThai)
       VALUES (4, ?, 'HoatDong')`,
      [MatKhau]
    );

    const maTaiKhoan = accountResult.insertId;

    await connection.query(
      `INSERT INTO benhnhan
       (MaTaiKhoan, HoTen, Email, SDT, NgaySinh, GioiTinh, DiaChi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        maTaiKhoan,
        HoTen,
        Email || null,
        SDT || null,
        NgaySinh || null,
        GioiTinh || null,
        DiaChi || null
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Đăng ký thành công',
      MaTaiKhoan: maTaiKhoan
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi đăng ký tài khoản:', error);
    res.status(500).json({ message: 'Lỗi đăng ký tài khoản', error: error.message });
  } finally {
    connection.release();
  }
});

// Đăng nhập bằng Email hoặc SDT
router.post('/dang-nhap', async (req, res) => {
  const { TenDangNhap, MatKhau } = req.body;

  if (!TenDangNhap || !MatKhau) {
    return res.status(400).json({ message: 'Vui lòng nhập TenDangNhap và MatKhau' });
  }

  try {
    const [result] = await db.query(
      `SELECT
          tk.MaTaiKhoan,
          tk.MaVaiTro,
          tk.TrangThai,
          bn.MaBenhNhan,
          bn.HoTen,
          bn.Email,
          bn.SDT,
          bn.NgaySinh,
          bn.GioiTinh,
          bn.DiaChi
       FROM taikhoan tk
       LEFT JOIN benhnhan bn ON tk.MaTaiKhoan = bn.MaTaiKhoan
       WHERE (bn.Email = ? OR bn.SDT = ?) AND tk.MatKhau = ?`,
      [TenDangNhap, TenDangNhap, MatKhau]
    );

    if (result.length === 0) {
      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    if (result[0].TrangThai && result[0].TrangThai !== 'HoatDong') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa hoặc không hoạt động' });
    }

    res.json({
      message: 'Đăng nhập thành công',
      user: result[0]
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
  }
});

// Store for OTPs in-memory
const otpStore = new Map();

// Quên mật khẩu - tạo OTP và gửi về Gmail thật (Lưu OTP trong memory)
router.post('/quen-mat-khau', async (req, res) => {
  const { TenDangNhap } = req.body;

  if (!TenDangNhap) {
    return res.status(400).json({ message: 'Vui lòng nhập Email hoặc SDT' });
  }

  try {
    // Tìm email của bệnh nhân
    const [result] = await db.query(
      `SELECT bn.Email 
       FROM benhnhan bn
       JOIN taikhoan tk ON bn.MaTaiKhoan = tk.MaTaiKhoan
       WHERE bn.Email = ? OR bn.SDT = ? LIMIT 1`,
      [TenDangNhap, TenDangNhap]
    );

    if (result.length === 0 || !result[0].Email) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản hoặc tài khoản chưa có Email' });
    }

    const email = result[0].Email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 2 * 60 * 1000; // 2 phút

    // Lưu OTP vào memory store
    otpStore.set(email, { otp, expires });

    // Gửi email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[DentalCare] Mã xác thực OTP đặt lại mật khẩu',
      text: `Xin chào,\n\nMã xác thực OTP của bạn là: ${otp}\nMã này dùng để đặt lại mật khẩu tài khoản DentalCare của bạn. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nĐội ngũ DentalCare.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Lỗi gửi email:', error);
        otpStore.delete(email); // Xóa OTP khỏi store nếu lỗi
        return res.status(500).json({ message: 'Không thể gửi email OTP', error: error.message });
      }
      res.json({ message: 'Mã OTP đã được gửi về Gmail của bạn.' });
    });

  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi quên mật khẩu', error: error.message });
  }
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

  if (record.otp === OTP) {
    otpStore.delete(Email); // Xóa mã OTP sau khi xác thực thành công
    res.json({ success: true, message: 'Xác thực thành công' });
  } else {
    res.status(400).json({ success: false, message: 'Mã OTP không chính xác' });
  }
});

// Đặt lại mật khẩu bằng Email hoặc SDT
router.put('/dat-lai-mat-khau', async (req, res) => {
  const { TenDangNhap, MatKhauMoi } = req.body;

  if (!TenDangNhap || !MatKhauMoi) {
    return res.status(400).json({ message: 'Vui lòng nhập TenDangNhap và MatKhauMoi' });
  }

  try {
    const [result] = await db.query(
      `UPDATE taikhoan
       SET MatKhau = ?
       WHERE MaTaiKhoan = (
         SELECT MaTaiKhoan FROM benhnhan WHERE Email = ? OR SDT = ? LIMIT 1
       )`,
      [MatKhauMoi, TenDangNhap, TenDangNhap]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi đặt lại mật khẩu', error: error.message });
  }
});

// Đổi mật khẩu khi đã đăng nhập
router.put('/doi-mat-khau', async (req, res) => {
  const { MaTaiKhoan, MatKhauCu, MatKhauMoi } = req.body;

  if (!MaTaiKhoan || !MatKhauCu || !MatKhauMoi) {
    return res.status(400).json({ message: 'Thiếu thông tin yêu cầu đổi mật khẩu' });
  }

  try {
    const [users] = await db.query(
      'SELECT MatKhau FROM taikhoan WHERE MaTaiKhoan = ?',
      [MaTaiKhoan]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    if (users[0].MatKhau !== MatKhauCu) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
    }

    await db.query(
      'UPDATE taikhoan SET MatKhau = ? WHERE MaTaiKhoan = ?',
      [MatKhauMoi, MaTaiKhoan]
    );

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi đổi mật khẩu', error: error.message });
  }
});

module.exports = router;
