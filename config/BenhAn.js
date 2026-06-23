const express = require('express');
const router = express.Router();
const db = require('../CSDL');

//Lấy tt bệnh án dựa vào mã bệnh nhân
router.get('/benhnhan/:id',(req,res)=>{
    db.query(
        `SELECT *
         FROM benhan
         WHERE MaBenhNhan=?`,
        [req.params.id],
        (err,result)=>{
            res.json(result);
        }
    );
});

//Lấy tt bệnh án dựa vào mã bệnh án
router.get('/:id',(req,res)=>{
    db.query(
        `SELECT *
         FROM benhan
         WHERE MaBenhAn=?`,
        [req.params.id],
        (err,result)=>{
            res.json(result);
        }
    );
});

module.exports = router;