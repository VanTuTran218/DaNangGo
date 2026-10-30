import express from 'express';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { connectDB, closeDB } from './config/db';
import authRouter, { adminRouter } from './modules/auth/auth.routes';
import placesRouter from './modules/places/places.routes';
import adminPartnersRouter from './modules/admin/partners.routes';
import { adminPlacesRouter } from './modules/admin/admin.routes';
import { adminReviewsRouter, userReviewsRouter } from './modules/reviews/reviews.routes';
import accommodationsRouter from './modules/accommodations/accommodations.routes';
import travelRouter from './modules/routes/travel.routes';
import adminContentRouter from './modules/admin/admin-content.routes';
import restaurantRouter from './modules/restaurants/restaurants.routes';
import categoriesRouter from './modules/categories/categories.routes';
import menuItemsRouter from './modules/menu-items/menu-items.routes';
import attractionsRouter from './modules/attractions/attractions.routes';
import partnerRouter from './modules/partner/partner.routes';
import subscriptionsRouter from './modules/subscriptions/subscriptions.routes';
import adminSubscriptionsRouter from './modules/admin/subscriptions.routes';
import adminUsersRouter from './modules/admin/users.routes';
import sepayWebhookRouter from './modules/subscriptions/sepay.routes';
import { csrfProtection } from './middleware/csrf.middleware';
import { errorHandler } from './middleware/error-handler';

// Load biến môi trường từ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(cookieParser());
app.use('/uploads/avatars', express.static(path.resolve(process.cwd(), 'uploads', 'avatars'), {
  dotfiles: 'deny',
  fallthrough: false,
  immutable: true,
  maxAge: '1y',
}));
// SePay HMAC must be verified against the original request bytes before JSON parsing.
app.use('/api/webhooks/sepay', sepayWebhookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);

// ==================== ROUTES ====================
app.use('/api/auth', authRouter);
app.use('/api/admin/auth', adminRouter);
app.use('/api/admin/partners', adminPartnersRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/places', adminPlacesRouter);
app.use('/api/admin/subscriptions', adminSubscriptionsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/places', placesRouter);
app.use('/api/admin/reviews', adminReviewsRouter);
app.use('/api/reviews', userReviewsRouter);
app.use('/api/accommodations', accommodationsRouter);
app.use('/api/routes', travelRouter);
app.use('/api/admin', adminContentRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/menu-items', menuItemsRouter);
app.use('/api/attractions', attractionsRouter);
app.use('/api/partner', partnerRouter);
app.use('/api', categoriesRouter);
app.use('/api/categories', categoriesRouter);

// TODO: Import và đăng ký các router theo từng module
// import authRouter from './modules/auth/auth.routes';
// import usersRouter from './modules/users/users.routes';
// import placesRouter from './modules/places/places.routes';

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
