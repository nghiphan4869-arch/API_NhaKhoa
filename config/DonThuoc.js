const express = require('express');
const router = express.Router();
const db = require('../CSDL');

router.get('/:maBenhAn',(req,res)=>{

    db.query(
        `SELECT
            dt.MaDonThuoc,
            dt.NgayKeDon,
            t.TenThuoc,
            ct.SoLuong,
            ct.CachDung
        FROM donthuoc dt
        JOIN chitiet_donthuoc ct
        ON dt.MaDonThuoc = ct.MaDonThuoc
        JOIN thuoc t
        ON t.MaThuoc = ct.MaThuoc
        WHERE dt.MaBenhAn=?`,
        [req.params.maBenhAn],
        (err,result)=>{
            res.json(result);
        }
    );

});

module.exports = router;