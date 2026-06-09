const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Kết nối CSDL
require('./CSDL');

// Routes
app.use('/api/tai-khoan', require('./config/TaiKhoan'));
app.use('/api/benh-nhan', require('./config/BenhNhan'));
app.use('/api/lich-hen', require('./config/LichHen'));
app.use('/api/kham-benh', require('./config/KhamBenh'));
app.use('/api/dich-vu', require('./config/DichVu'));
app.use('/api/hoa-don', require('./config/HoaDon'));
app.use('/api/bao-cao', require('./config/BaoCao'));

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
