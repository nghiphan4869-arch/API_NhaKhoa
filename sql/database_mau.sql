-- File mẫu để tạo database nếu bạn chưa có database.
-- Nếu bạn đã có database quanlynhakhoa rồi thì không cần chạy toàn bộ file này.

CREATE DATABASE IF NOT EXISTS quanlynhakhoa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quanlynhakhoa;

CREATE TABLE IF NOT EXISTS taikhoan (
  MaTaiKhoan INT AUTO_INCREMENT PRIMARY KEY,
  MaVaiTro INT DEFAULT 1,
  MatKhau VARCHAR(255) NOT NULL,
  OTP VARCHAR(10),
  TrangThai VARCHAR(50) DEFAULT 'HoatDong'
);

CREATE TABLE IF NOT EXISTS benhnhan (
  MaBenhNhan INT AUTO_INCREMENT PRIMARY KEY,
  MaTaiKhoan INT,
  HoTen VARCHAR(255) NOT NULL,
  Email VARCHAR(255),
  SDT VARCHAR(20),
  NgaySinh DATE,
  GioiTinh VARCHAR(20),
  DiaChi VARCHAR(255),
  FOREIGN KEY (MaTaiKhoan) REFERENCES taikhoan(MaTaiKhoan)
);

CREATE TABLE IF NOT EXISTS dichvu (
  MaDichVu INT AUTO_INCREMENT PRIMARY KEY,
  TenDichVu VARCHAR(255) NOT NULL,
  DonGia DECIMAL(12,2) DEFAULT 0,
  MoTa TEXT,
  ThoiGian INT DEFAULT 30,
  TrangThai VARCHAR(50) DEFAULT 'HoatDong'
);

CREATE TABLE IF NOT EXISTS lichhen (
  MaLichHen INT AUTO_INCREMENT PRIMARY KEY,
  MaBenhNhan INT NOT NULL,
  MaBacSi INT NOT NULL,
  NgayHen DATE NOT NULL,
  GioHen TIME NOT NULL,
  LyDoKham VARCHAR(255),
  HinhThucDat VARCHAR(50) DEFAULT 'App',
  TrangThai VARCHAR(50) DEFAULT 'ChoDuyet'
);

CREATE TABLE IF NOT EXISTS benhan (
  MaBenhAn INT AUTO_INCREMENT PRIMARY KEY,
  MaBenhNhan INT NOT NULL,
  ChanDoan TEXT,
  KetQuaDieuTri TEXT,
  NgayLap DATE DEFAULT (CURRENT_DATE)
);

CREATE TABLE IF NOT EXISTS donthuoc (
  MaDonThuoc INT AUTO_INCREMENT PRIMARY KEY,
  MaBenhAn INT NOT NULL,
  NgayKeDon DATE DEFAULT (CURRENT_DATE)
);

CREATE TABLE IF NOT EXISTS thuoc (
  MaThuoc INT AUTO_INCREMENT PRIMARY KEY,
  TenThuoc VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS chitiet_donthuoc (
  MaChiTiet INT AUTO_INCREMENT PRIMARY KEY,
  MaDonThuoc INT NOT NULL,
  MaThuoc INT NOT NULL,
  SoLuong INT DEFAULT 1,
  CachDung VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS theodoi_dieutri (
  MaTheoDoi INT AUTO_INCREMENT PRIMARY KEY,
  MaBenhAn INT NOT NULL,
  MucDoDau INT,
  TinhTrangSauDungThuoc TEXT,
  PhanHoiBenhNhan TEXT
);

CREATE TABLE IF NOT EXISTS thongbao (
  MaThongBao INT AUTO_INCREMENT PRIMARY KEY,
  MaBenhNhan INT,
  TieuDe VARCHAR(255),
  NoiDung TEXT,
  DaDoc TINYINT DEFAULT 0,
  NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dichvu (TenDichVu, DonGia, MoTa, ThoiGian, TrangThai)
VALUES
('Khám tổng quát', 100000, 'Khám răng tổng quát', 30, 'HoatDong'),
('Cạo vôi răng', 200000, 'Cạo vôi và vệ sinh răng', 45, 'HoatDong'),
('Nhổ răng', 300000, 'Nhổ răng thường', 60, 'HoatDong');
