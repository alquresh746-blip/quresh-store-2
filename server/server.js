import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import { protect } from './middleware/auth.middleware.js';
import { adminOnly } from './middleware/admin.middleware.js';
import { getAdminStats, getRecentOrders } from './controllers/order.controller.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import userRoutes from './routes/user.routes.js';
import User from './models/User.model.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Admin utility routes (matches existing adminAPI.js service calls)
app.get('/api/admin/stats', protect, adminOnly, getAdminStats);
app.get('/api/admin/recent-orders', protect, adminOnly, getRecentOrders);

app.get('/api/health', (_, res) => res.json({ status: 'OK', env: process.env.NODE_ENV }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'Al-Quresh Admin',
      email: 'alquresh746@gmail.com',
      password: '@lquresh123',
      phone: '03001234567',
      role: 'admin',
    });
    console.log('✅ Admin created: alquresh746@gmail.com');
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
});
