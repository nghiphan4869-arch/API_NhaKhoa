//Lấy tt bệnh nhân dựa theo Mã
const express = require('express');
const router = express.Router();
const db = require('../CSDL');

//Lấy danh sách bệnh nhân
router.get('/', (req, res) => {
    db.query(
        `SELECT
            MaBenhNhan,
            HoTen,
            Email,
            SDT,
            DiaChi
         FROM benhnhan`,
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);
        }
    );
});

//Lấy bệnh nhân dựa trên mã bn
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

//Cập nhật tt bệnh nhân
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