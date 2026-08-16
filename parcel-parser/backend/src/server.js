import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

import uploadRoutes from './routes/uploadRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { dbService } from './services/storage/supabaseService.js';
import { getGeminiModelName } from './services/gemini/geminiClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Parcel Label AI Extraction API',
    model: getGeminiModelName(),
    supabase_connected: dbService.isConfigured(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` 🚀 Parcel Label Extraction API Server`);
  console.log(` 📍 Running on: http://localhost:${PORT}`);
  console.log(` 🤖 Configured Gemini Model: ${getGeminiModelName()}`);
  const isDbConfigured = typeof dbService.isConfigured === 'function' ? dbService.isConfigured() : false;
  console.log(` 🗄️ Database Backend: ${isDbConfigured ? 'Supabase PostgreSQL' : 'Local Fallback Storage'}`);
  console.log(`===================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server Warning] Port ${PORT} is busy. Retrying in 1s...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 1000);
  } else {
    console.error('[Server Error]', err);
  }
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
