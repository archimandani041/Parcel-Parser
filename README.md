# AI-Powered Parcel / Shipping Label Information Extraction Platform

Production-quality **template-independent** parcel label extraction platform powered by **Google Gemini API Multimodal Document Understanding**, **Node.js Express API**, **Supabase PostgreSQL & Storage**, and **React.js + Vite + Tailwind CSS**.

---

## 🌟 Key Features

1. **Template-Independent Extraction**
   - No hardcoded pixel coordinates, bounding boxes, or fixed courier templates.
   - Leverages Gemini API's multimodal document understanding to analyze visual layout, labels, table structures, and semantic meaning dynamically across any courier (Flipkart, Amazon, Delhivery, E-Kart, BlueDart, XpressBees, DTDC, FedEx, etc.).

2. **Multi-Format & Multi-Page Support**
   - Supports JPG, JPEG, PNG, WEBP, BMP, TIFF, and PDF documents (including multi-page PDFs).
   - Automatic MIME-type detection on backend.

3. **Structured JSON Schema Enforcement**
   - Enforces strict JSON Schema extraction via Google GenAI SDK's `responseSchema` capabilities.
   - Extracts Order ID, AWB/Tracking number, Customer name & address, City/State/Pincode, Multiple Product line items (SKU, Qty, Price), Seller GSTIN, Amounts, and preserves unknown fields under `additional_fields`.
   - Never hallucinates missing fields (returns `null` when info is absent).

4. **Deterministic Validation & Scoring**
   - Post-Gemini validation layer for GSTIN format, Indian PIN code format, numeric quantity/price sanity checks, and ISO date normalization.
   - Computes weighted overall confidence score and flags document status as `COMPLETED`, `NEEDS_REVIEW`, or `FAILED`.

5. **Split-Screen Interactive Dashboard**
   - High-resolution document viewer with Zoom In/Out, Rotate, and Fullscreen preview controls.
   - Categorized extraction cards with inline edit controls allowing manual value corrections saved to an audit log (`corrections` table).
   - Raw Gemini Response developer/debug tab displaying processing time, model telemetry, and missing fields list.

6. **Flexible Export Capabilities**
   - Export extracted data in **Structured JSON**, **CSV**, or **Microsoft Excel (XLSX)** format. Single or bulk selections supported.

---

## 🏗️ Architecture

```text
React.js + Vite (Port 3000)
        ↓
Express.js Backend API (Port 5000)
        ↓
Google GenAI SDK (Gemini API)
        ↓
Deterministic Validation Service
        ↓
Supabase PostgreSQL & Storage (or Local Persistent Fallback Engine)
```

> **Security Note:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` reside exclusively on the Node.js backend. They are never exposed to browser code.

---

## 🚀 Environment Setup

### 1. Backend `.env`

Copy `.env.example` to `backend/.env`:

```env
PORT=5000

# Supabase Credentials (obtain from Supabase Dashboard -> Project Settings -> API)
SUPABASE_URL=https://your-supabase-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google AI Studio Gemini API Key
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio

# Configurable Gemini Model Name
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🗄️ Supabase Migration Setup

Run the SQL migration script located in `supabase/migrations/01_initial_schema.sql` inside your Supabase SQL Editor:

1. Creates tables: `documents`, `extraction_results`, `extracted_items`, `extracted_fields`, `corrections`.
2. Creates public storage bucket: `parcel-labels`.
3. Configures triggers and indexes for optimal performance.

*(Note: If Supabase credentials are not provided, the server automatically utilizes a built-in persistent local storage engine in `backend/uploads/` and `backend/uploads_db.json`, ensuring the app operates out-of-the-box.)*

---

## 💻 Running the Application

### 1. Start Backend Server

```bash
cd parcel-parser/backend
npm install
npm run dev
```

Server runs at `http://localhost:5000`

### 2. Start Frontend App

```bash
cd parcel-parser/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 📋 API Endpoints

- `GET /api/health` - Health check & connected model status
- `POST /api/upload` - Multipart file upload & AI extraction
- `GET /api/documents` - List all documents & dashboard metrics
- `GET /api/documents/:id` - Get document detail, structured JSON, & raw response
- `PUT /api/documents/:id/corrections` - Save manual field correction
- `DELETE /api/documents/:id` - Delete document record
- `POST /api/export` - Export documents to JSON, CSV, or Excel
