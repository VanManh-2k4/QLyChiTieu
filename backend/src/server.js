import express from 'express';
import cors from 'cors';
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

initDb();

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'QLyChiTieu API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/goals', goalRoutes);

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
