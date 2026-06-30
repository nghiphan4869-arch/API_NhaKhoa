require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./CSDL');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.json({
    message: 'API Quản Lý Nha Khoa đang chạy',
    status: 'OK',
    huong_dan_test: {
      test_api: '/test',
      test_database: '/test-db'
    },
    routes: [
      '/api/tai-khoan',
      '/api/benh-nhan',
      '/api/lich-hen',
      '/api/benh-an',
      '/api/don-thuoc',
      '/api/theo-doi',
      '/api/dich-vu',
      '/api/thong-bao'
    ]
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test API thành công',
    status: 'OK'
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({
      message: 'Kết nối MySQL thành công',
      data: rows
    });
  } catch (error) {
    console.error('Lỗi test database:', error);
    res.status(500).json({
      message: 'Lỗi kết nối MySQL',
      error: error.message,
      goi_y: 'Kiểm tra DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME trong Environment Variables của Render'
    });
  }
});

app.use('/api/tai-khoan', require('./config/TaiKhoan'));
app.use('/api/benh-nhan', require('./config/BenhNhan'));
app.use('/api/lich-hen', require('./config/LichHen'));
app.use('/api/benh-an', require('./config/BenhAn'));
app.use('/api/don-thuoc', require('./config/DonThuoc'));
app.use('/api/theo-doi', require('./config/TheoDoiDieuTri'));
app.use('/api/dich-vu', require('./config/DichVu'));
app.use('/api/thong-bao', require('./config/ThongBao'));

app.use((req, res) => {
  res.status(404).json({
    message: 'Không tìm thấy đường dẫn API',
    path: req.originalUrl
  });
});

app.use((error, req, res, next) => {
  console.error('Lỗi server:', error);
  res.status(500).json({
    message: 'Lỗi server',
    error: error.message
  });
});

const PORT = process.env.PORT || 3000;

// Tự động kiểm tra và thêm cột HinhAnh vào bảng benhnhan nếu chưa có
async function setupDatabase() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM benhnhan LIKE 'HinhAnh'");
    if (columns.length === 0) {
      await db.query("ALTER TABLE benhnhan ADD COLUMN HinhAnh VARCHAR(255) DEFAULT NULL");
      console.log("Đã tự động thêm cột HinhAnh vào bảng benhnhan");
    }
  } catch (error) {
    console.error("Lỗi đồng bộ cấu trúc database:", error);
  }
}
setupDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});
