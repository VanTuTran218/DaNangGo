# DaNangGo Backend

## Yêu cầu
- Node.js 18+
- SQL Server Express (localhost\SQLEXPRESS)

## Cài đặt

### 1. Cài dependencies
```bash
npm install
```

### 2. Tạo file .env
```bash
# Sao chép file mẫu
copy .env.example .env
```
Mở `.env` và điền password: `DB_PASS=TuTran@123`

### 3. Setup database
Mở SSMS và chạy file:
```
database/migrations/001_setup_login.sql
```

> Lưu ý: Đảm bảo SQL Server đã bật **Mixed Mode Authentication** và **TCP/IP port 1433**

### 4. Chạy server
```bash
npm run dev
```

Server chạy tại: `http://localhost:5000`
