const express = require('express');
const router = express.Router();
const db = require('../CSDL');

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
       VALUES (1, ?, 'HoatDong')`,
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

// Quên mật khẩu - tạo OTP
router.post('/quen-mat-khau', async (req, res) => {
  const { TenDangNhap } = req.body;

  if (!TenDangNhap) {
    return res.status(400).json({ message: 'Vui lòng nhập Email hoặc SDT' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const [result] = await db.query(
      `UPDATE taikhoan
       SET OTP = ?
       WHERE MaTaiKhoan = (
         SELECT MaTaiKhoan FROM benhnhan WHERE Email = ? OR SDT = ? LIMIT 1
       )`,
      [otp, TenDangNhap, TenDangNhap]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    res.json({
      message: 'Tạo OTP thành công',
      OTP: otp
    });
  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi quên mật khẩu', error: error.message });
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
