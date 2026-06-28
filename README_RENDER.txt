HƯỚNG DẪN CHẠY API_NhaKhoa

1) Chạy local:
   npm install
   npm start

2) Test local:
   http://localhost:3000/
   http://localhost:3000/test
   http://localhost:3000/test-db

3) Deploy Render:
   New Web Service -> chọn repo GitHub
   Runtime: Node
   Branch: master hoặc main theo repo của bạn
   Build Command: npm install
   Start Command: npm start

4) Environment Variables trên Render:
   DB_HOST=host_mysql_cua_ban
   DB_PORT=3306
   DB_USER=user_mysql_cua_ban
   DB_PASSWORD=mat_khau_mysql_cua_ban
   DB_NAME=quanlynhakhoa

5) Test sau deploy:
   https://ten-service.onrender.com/
   https://ten-service.onrender.com/test
   https://ten-service.onrender.com/test-db

Lưu ý:
- Nếu / và /test chạy nhưng /test-db lỗi: API đã chạy, chỉ còn sai thông tin MySQL.
- Không nhập npm install vào ô Start Command. Start Command phải là npm start.
