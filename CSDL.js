const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'quanlynhakhoa' 
});

db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err);
        return;
    }
    console.log('--- Đã kết nối thành công tới Database books ---');
});

module.exports = db;