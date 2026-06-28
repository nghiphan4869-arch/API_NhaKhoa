require('dotenv').config();
const db = require('./CSDL');

async function runUpdate() {
  try {
    await db.query('UPDATE lichhen SET MaBacSi = 3 WHERE MaLichHen = 4');
    console.log('Updated MaLichHen 4 to MaBacSi 3');

    await db.query('UPDATE lichhen SET MaBacSi = 4 WHERE MaLichHen = 7');
    console.log('Updated MaLichHen 7 to MaBacSi 4');
  } catch (error) {
    console.error('Lỗi cập nhật bác sĩ:', error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

runUpdate();
