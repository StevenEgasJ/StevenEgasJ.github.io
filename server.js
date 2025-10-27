const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
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

    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (err) {
    console.error('Error proxying to NewsAPI:', err.message);
    res.status(err.response?.status || 500).json({ error: err.message, details: err.response?.data });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT} — abre la app en esa URL`);
});
