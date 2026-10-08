import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './config/db';

// Load biến môi trường từ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());                          // Cho phép frontend gọi API
app.use(express.json());                  // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// ==================== ROUTES ====================
// TODO: Import và đăng ký các router theo từng module
// import authRouter from './modules/auth/auth.routes';
// import usersRouter from './modules/users/users.routes';
// import placesRouter from './modules/places/places.routes';

// Kiểm tra server đang chạy
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DaNangGo API đang chạy 🚀' });
});

// ==================== KHỞI ĐỘNG SERVER ====================
async function startServer() {
  try {
    // Kết nối database trước khi lắng nghe request
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown - đóng DB khi tắt server
    process.on('SIGTERM', async () => {
      console.log('Đang tắt server...');
      await closeDB();
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', async () => {
      console.log('\nĐang tắt server...');
      await closeDB();
      server.close(() => process.exit(0));
    });

  } catch (error) {
    console.error('❌ Không thể khởi động server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
