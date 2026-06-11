const express = require('express');
const router = express.Router();
const db = require('../CSDL');

router.get('/:id',(req,res)=>{

    db.query(
        `SELECT *
         FROM benhnhan
         WHERE MaBenhNhan=?`,
        [req.params.id],
        (err,result)=>{
            res.json(result);
        }
    );

});

router.put('/:id',(req,res)=>{

    const {
        HoTen,
        Email,
        SDT,
        DiaChi
    } = req.body;

    db.query(
        `UPDATE benhnhan
        SET HoTen=?,
            Email=?,
            SDT=?,
            DiaChi=?
        WHERE MaBenhNhan=?`,
        [
            HoTen,
            Email,
            SDT,
            DiaChi,
            req.params.id
        ]
    );

    res.json({
        message:'Cập nhật thành công'
    });

});

module.exports = router;