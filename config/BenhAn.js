const express = require('express');
const router = express.Router();
const db = require('../CSDL');

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