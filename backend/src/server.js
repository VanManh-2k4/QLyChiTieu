import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDb } from './database/db.js';
import { config } from './config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

initDb();

const app = express();
// SECURITY: Restrict CORS to specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://192.168.3.104:5173/'];

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// SECURITY: Rate limiting for protected routes (prevents API abuse)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'QLyChiTieu API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallets', apiLimiter, walletRoutes);
app.use('/api/transactions', apiLimiter, transactionRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/budgets', apiLimiter, budgetRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/savings', apiLimiter, savingsRoutes);
app.use('/api/history', apiLimiter, historyRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);
app.use('/api/goals', apiLimiter, goalRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`QLyChiTieu API listening on http://localhost:${config.port}`);
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(
      `Port ${config.port} is already in use. Stop the other process or set PORT to another value (e.g. PORT=3002).`
    );
    process.exitCode = 1;
    return;
  }
  console.error(err);
  process.exitCode = 1;
});
