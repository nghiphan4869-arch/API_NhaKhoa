const db = require('./CSDL');

const runUpdate = () => {
  db.query(
    `UPDATE lichhen SET MaBacSi = 3 WHERE MaLichHen = 4`,
    (err, result) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log('Updated MaLichHen 4 to MaBacSi 3');

      db.query(
        `UPDATE lichhen SET MaBacSi = 4 WHERE MaLichHen = 7`,
        (err2, result2) => {
          if (err2) {
            console.error(err2);
            process.exit(1);
          }
          console.log('Updated MaLichHen 7 to MaBacSi 4');
          process.exit(0);
        }
      );
    }
  );
};

runUpdate();
