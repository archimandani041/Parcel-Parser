import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

try {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
} catch {}
dotenv.config();

import uploadRoutes from './routes/uploadRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { dbService } from './services/storage/supabaseService.js';
import { getGeminiModelName } from './services/gemini/geminiClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version']
}));
app.options('*', (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.status(200).end();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use('/uploads', express.static(path.join('/tmp', 'uploads')));
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Parcel Label AI Extraction API',
    model: getGeminiModelName(),
    timestamp: new Date().toISOString()
  });
});

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
app.use('/api/stock', stockRoutes);

app.use(errorHandler);

let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
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
    if (server) server.close(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    if (server) server.close(() => process.exit(0));
  });
}

export default app;

