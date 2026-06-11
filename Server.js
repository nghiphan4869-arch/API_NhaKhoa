const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Kết nối CSDL
require('./CSDL');

// Routes
app.use('/api/tai-khoan',require('./config/TaiKhoan'));
app.use('/api/benh-nhan',require('./config/BenhNhan'));
app.use('/api/lich-hen',require('./config/LichHen'));
app.use('/api/benh-an',require('./config/BenhAn'));
app.use('/api/don-thuoc',require('./config/DonThuoc'));
app.use('/api/theo-doi',require('./config/TheoDoiDieuTri'));
// app.use('/api/hoa-don',require('./config/ThongBao'));

// Trang chủ test
app.get('/', (req, res) => {
    res.send('API Quản Lý Nha Khoa');
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});

// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server đang chạy tại: http://0.0.0.0:${PORT}`);
// });
