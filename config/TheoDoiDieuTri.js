const express = require('express');
const router = express.Router();
const db = require('../CSDL');

router.get('/:maBenhAn',(req,res)=>{

    db.query(
        `SELECT *
        FROM theodoi_dieutri
        WHERE MaBenhAn=?`,
        [req.params.maBenhAn],
        (err,result)=>{
            res.json(result);
        }
    );

});

router.put('/phan-hoi/:id',(req,res)=>{

    const {
        MucDoDau,
        TinhTrangSauDungThuoc,
        PhanHoiBenhNhan
    } = req.body;

    db.query(
        `UPDATE theodoi_dieutri
        SET
        MucDoDau=?,
        TinhTrangSauDungThuoc=?,
        PhanHoiBenhNhan=?
        WHERE MaTheoDoi=?`,
        [
            MucDoDau,
            TinhTrangSauDungThuoc,
            PhanHoiBenhNhan,
            req.params.id
        ]
    );

    res.json({
        message:'Gửi phản hồi thành công'
    });

});

module.exports = router;