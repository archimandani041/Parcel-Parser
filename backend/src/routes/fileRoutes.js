import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase') && !supabaseKey.includes('your-supabase')) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/files/:filename
 * 
 * Serves uploaded files. Tries:
 *   1. Local disk (uploads/ directory) — works locally and on Vercel /tmp
 *   2. Supabase Storage (parcel-labels bucket) — works on Vercel production
 */
router.get('/:filename', async (req, res) => {
  const { filename } = req.params;
  const decodedFilename = decodeURIComponent(filename);

  // 1. Try local filesystem first
  const localPaths = [
    path.join(process.cwd(), 'uploads', decodedFilename),
    path.join('/tmp', 'uploads', decodedFilename)
  ];

  for (const localPath of localPaths) {
    try {
      if (fs.existsSync(localPath)) {
        const ext = path.extname(decodedFilename).toLowerCase();
        const mimeTypes = {
          '.pdf': 'application/pdf',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.gif': 'image/gif'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${decodedFilename}"`);
        return fs.createReadStream(localPath).pipe(res);
      }
    } catch (_) { /* try next */ }
  }

  // 2. Try Supabase Storage — search for the file by partial name match
  if (supabase) {
    try {
      // List files in labels/ folder and find matching file
      const { data: fileList, error: listErr } = await supabase.storage
        .from('parcel-labels')
        .list('labels', { limit: 200 });

      if (!listErr && fileList) {
        // Sanitize the filename the same way uploadLabelFile does
        const sanitizedName = decodedFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        // Find matching file (uploaded with timestamp prefix)
        const match = fileList.find(f => f.name.endsWith(`_${sanitizedName}`) || f.name === sanitizedName || f.name === decodedFilename);

        if (match) {
          const storagePath = `labels/${match.name}`;

          // Download the file from Supabase Storage
          const { data: fileData, error: dlErr } = await supabase.storage
            .from('parcel-labels')
            .download(storagePath);

          if (!dlErr && fileData) {
            const ext = path.extname(decodedFilename).toLowerCase();
            const mimeTypes = {
              '.pdf': 'application/pdf',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.webp': 'image/webp',
              '.gif': 'image/gif'
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="${decodedFilename}"`);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            const buffer = Buffer.from(await fileData.arrayBuffer());
            return res.send(buffer);
          }
        }
      }

      // Also try direct public URL redirect
      const sanitizedName = decodedFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const { data: files2 } = await supabase.storage
        .from('parcel-labels')
        .list('labels', { limit: 500, search: sanitizedName });

      if (files2 && files2.length > 0) {
        const storagePath = `labels/${files2[0].name}`;
        const { data: publicUrlData } = supabase.storage
          .from('parcel-labels')
          .getPublicUrl(storagePath);

        if (publicUrlData?.publicUrl) {
          return res.redirect(publicUrlData.publicUrl);
        }
      }
    } catch (err) {
      console.warn(`[File Serve] Supabase Storage lookup failed: ${err.message}`);
    }
  }

  // 3. Nothing found
  return res.status(404).json({
    success: false,
    error: `File not found: ${decodedFilename}`
  });
});

export default router;
