import app from '../src/server.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    return await app(req, res);
  } catch (err) {
    console.error('[Vercel Handler Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  }
}
