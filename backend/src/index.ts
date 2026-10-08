import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { connectDB, closeDB } from './config/db';
import authRouter, { adminRouter } from './modules/auth/auth.routes';
import placesRouter from './modules/places/places.routes';
import { csrfProtection } from './middleware/csrf.middleware';
import { errorHandler } from './middleware/error-handler';

// Load biến môi trường từ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);

// ==================== ROUTES ====================
app.use('/api/auth', authRouter);
app.use('/api/admin/auth', adminRouter);
app.use('/api/places', placesRouter);

// Kiểm tra server đang chạy
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DaNangGo API đang chạy 🚀' });
});

app.use(errorHandler);

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
