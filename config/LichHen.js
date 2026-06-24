const express = require('express');
const router = express.Router();
const db = require('../CSDL');

//Đặt lịch hẹn
router.post('/', (req, res) => {
    const {
        MaBenhNhan,
        MaBacSi,
        NgayHen,
        GioHen,
        LyDoKham
    } = req.body;

    // 1. Lấy danh sách dịch vụ để biết thời gian thực hiện (duration)
    db.query("SELECT TenDichVu, ThoiGian FROM dichvu", (err, services) => {
        if (err) {
            console.error('Lỗi khi lấy dịch vụ:', err);
            return res.status(500).json({ error: 'Lỗi server khi kiểm tra dịch vụ' });
        }

        const serviceDurations = {};
        if (services && services.length > 0) {
            services.forEach(s => {
                serviceDurations[s.TenDichVu] = s.ThoiGian;
            });
        }

        // Xác định duration của lịch hẹn mới
        const serviceName = LyDoKham.split(':')[0].trim();
        const duration = serviceDurations[serviceName] || 30;

        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const parts = timeStr.split(':');
            const hour = parseInt(parts[0], 10) || 0;
            const minute = parseInt(parts[1], 10) || 0;
            return hour * 60 + minute;
        };

        const newStart = timeToMinutes(GioHen);
        const newEnd = newStart + duration;

        // 2. Lấy tất cả lịch hẹn trong ngày đó của Bác sĩ hoặc Bệnh nhân
        db.query(
            `SELECT * FROM lichhen 
             WHERE NgayHen = ? AND TrangThai != 'DaHuy'`,
            [NgayHen],
            (err, appointments) => {
                if (err) {
                    console.error('Lỗi khi lấy lịch hẹn:', err);
                    return res.status(500).json({ error: 'Lỗi server khi lấy lịch hẹn' });
                }

                // Kiểm tra trùng giờ
                if (appointments && appointments.length > 0) {
                    for (let app of appointments) {
                        const appStart = timeToMinutes(app.GioHen);
                        const appServiceName = (app.LyDoKham || '').split(':')[0].trim();
                        const appDuration = serviceDurations[appServiceName] || 30;
                        const appEnd = appStart + appDuration;

                        // Kiểm tra overlap
                        const hasOverlap = newStart < appEnd && appStart < newEnd;

                        if (hasOverlap) {
                            // Trường hợp 1: Trùng lịch của Bác sĩ (tính cả lịch chờ duyệt và đã duyệt)
                            if (app.MaBacSi === parseInt(MaBacSi, 10)) {
                                return res.status(400).json({
                                    error: 'Trùng lịch',
                                    message: 'Bác sĩ đã có lịch hẹn trong khung giờ này.'
                                });
                            }

                            // Trường hợp 2: Trùng lịch của chính Bệnh nhân này (tính cả ChoDuyet và đã duyệt)
                            if (app.MaBenhNhan === parseInt(MaBenhNhan, 10)) {
                                return res.status(400).json({
                                    error: 'Trùng lịch bệnh nhân',
                                    message: 'Bạn đã có lịch hẹn khác trùng/giao với khung giờ này.'
                                });
                            }
                        }
                    }
                }

                // 3. Nếu không trùng, tiến hành insert
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
                    ],
                    (insertErr, insertResult) => {
                        if (insertErr) {
                            console.error('Lỗi khi lưu lịch hẹn:', insertErr);
                            return res.status(500).json({ error: 'Lỗi khi lưu lịch hẹn' });
                        }
                        res.json({
                            message: 'Đặt lịch thành công'
                        });
                    }
                );
            }
        );
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

//Lấy danh sách lịch hẹn của bác sĩ
router.get('/bacsi/:id',(req,res)=>{
    db.query(
        `SELECT *
         FROM lichhen
         WHERE MaBacSi=?`,
        [req.params.id],
        (err,result)=>{
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(result);
            }
        }
    );
});

//Huỷ lịch hẹn
router.put('/huy/:id',(req,res)=>{
    db.query(
        `UPDATE lichhen
         SET TrangThai='DaHuy'
         WHERE MaLichHen=? AND TrangThai='ChoDuyet'`,
        [req.params.id]
    );

    res.json({
        message:'Đã hủy lịch'
    });
});

module.exports = router;