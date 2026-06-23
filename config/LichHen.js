const express = require('express');
const router = express.Router();
const db = require('../CSDL');

//Đặt lịch hẹn
router.post('/',(req,res)=>{
    const {
        MaBenhNhan,
        MaBacSi,
        NgayHen,
        GioHen,
        LyDoKham
    } = req.body;

    db.query(
        `INSERT INTO lichhen
        (
            MaBenhNhan,
            MaBacSi,
            NgayHen,
            GioHen,
            LyDoKham,
            HinhThucDat,
            TrangThai
        )
        VALUES(?,?,?,?,?,
        'App',
        'ChoDuyet')`,
        [
            MaBenhNhan,
            MaBacSi,
            NgayHen,
            GioHen,
            LyDoKham
        ]
    );
    res.json({
        message:'Đặt lịch thành công'
    });
});

//Lấy tt lịch hẹn dựa vào mã bệnh nhân
router.get('/benhnhan/:id',(req,res)=>{

    db.query(
        `SELECT *
        FROM lichhen
        WHERE MaBenhNhan=?`,
        [req.params.id],
        (err,result)=>{
            res.json(result);
        }
    );
});

//Lấy tt lịch hẹn dựa vào mã lịch hẹn
router.get('/:id',(req,res)=>{
    db.query(
        `SELECT *
         FROM lichhen
         WHERE MaLichHen=?`,
        [req.params.id],
        (err,result)=>{
            res.json(result);
        }
    );
});

//Huỷ lịch hẹn
router.put('/huy/:id',(req,res)=>{
    db.query(
        `UPDATE lichhen
         SET TrangThai='DaHuy'
         WHERE MaLichHen=?`,
        [req.params.id]
    );

    res.json({
        message:'Đã hủy lịch'
    });
});

module.exports = router;