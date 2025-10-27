const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

if (!NEWSAPI_KEY) {
  console.warn('WARNING: NEWSAPI_KEY no está configurada. Obtén una clave en https://newsapi.org y exporta la variable NEWSAPI_KEY');
}

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Proxy simple hacia NewsAPI para no exponer la API key en el frontend
app.get('/api/news', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const country = (req.query.country || '').trim();
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);

    const params = { apiKey: NEWSAPI_KEY, pageSize };

    // Build request: avoid sending empty `q` (NewsAPI returns 400 if everything called with empty q)
    // Priority:
    // - If country provided -> top-headlines (optionally with q)
    // - Else if q provided -> everything
    // - Else (no q, no country) -> fallback to a safe default query ('news') on everything
    let url;
    if (country) {
      url = 'https://newsapi.org/v2/top-headlines';
      params.country = country;
      if (q) params.q = q;
    } else if (q) {
      url = 'https://newsapi.org/v2/everything';
      params.q = q;
    } else {
      // no filters provided: use a generic fallback to return useful results instead of 400
      url = 'https://newsapi.org/v2/everything';
      params.q = 'news';
    }

    // Debug log of outgoing request (helpful during dev)
    console.debug('Proxying to NewsAPI', { url, params: { ...params, apiKey: '***' } });

    // Send API key via header (recommended) and params without apiKey
    const headers = { 'X-Api-Key': NEWSAPI_KEY };
    const response = await axios.get(url, { params, headers });
    res.json(response.data);
  } catch (err) {
    // Improve error output for 401 and include response details when available
    const status = err.response?.status || 500;
    const details = err.response?.data;
    if (status === 401) {
      console.error('NewsAPI unauthorized (401). Check NEWSAPI_KEY in environment.');
      console.error('Proxying to NewsAPI', { url, params: { ...params, apiKey: '***' } });
      console.error('NewsAPI response:', details);
      return res.status(401).json({ error: 'Unauthorized: invalid NEWSAPI_KEY. Check environment configuration.', details });
    }
    console.error('Error proxying to NewsAPI:', err.message);
    console.error('Proxying to NewsAPI', { url, params: { ...params, apiKey: '***' } });
    console.error('NewsAPI response:', details);
    res.status(status).json({ error: err.message, details });
  }
});

// Endpoint to check whether the configured NEWSAPI_KEY is valid (does a minimal request)
app.get('/check-key', async (req, res) => {
  if (!NEWSAPI_KEY) return res.status(400).json({ valid: false, message: 'NEWSAPI_KEY not set in environment' });
  try {
    const testUrl = 'https://newsapi.org/v2/top-headlines';
    const testParams = { country: 'us', pageSize: 1 };
    const headers = { 'X-Api-Key': NEWSAPI_KEY };
    const r = await axios.get(testUrl, { params: testParams, headers });
    // If status is 200 and articles present (or totalResults), consider it valid
    if (r.status === 200) return res.json({ valid: true });
    return res.status(200).json({ valid: false, status: r.status, data: r.data });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data;
    if (status === 401) return res.status(200).json({ valid: false, message: 'Unauthorized (401) from NewsAPI', details });
    return res.status(200).json({ valid: false, message: err.message, details });
  }
});

// Health check endpoint for deploy platforms (doesn't expose the API key)
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    port: PORT,
    newsapi_key_set: !!NEWSAPI_KEY
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor iniciado en http://${HOST}:${PORT} — abierto en todas las interfaces`);
  console.log(`NEWSAPI_KEY set: ${!!NEWSAPI_KEY}`);
});
