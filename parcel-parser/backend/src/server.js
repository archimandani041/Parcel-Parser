import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import uploadRoutes from './routes/uploadRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getGeminiModelName } from './services/gemini/geminiClient.js';
import { dbService } from './services/storage/supabaseService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for locally saved uploads (fallback)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Parcel Label AI Extraction API',
    model: getGeminiModelName(),
    supabase_connected: dbService.isConfigured(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/export', exportRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` 🚀 Parcel Label Extraction API Server`);
  console.log(` 📍 Running on: http://localhost:${PORT}`);
  console.log(` 🤖 Configured Gemini Model: ${getGeminiModelName()}`);
  console.log(` 🗄️ Database Backend: ${dbService.isConfigured() ? 'Supabase PostgreSQL' : 'Local Fallback Storage'}`);
  console.log(`===================================================`);
});
