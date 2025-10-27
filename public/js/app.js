const form = document.getElementById('searchForm');
const qInput = document.getElementById('q');
const countryInput = document.getElementById('country');
const newsGrid = document.getElementById('newsGrid');
const featureEl = document.getElementById('feature');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');
const emptyEl = document.getElementById('empty');
// navLinks will be queried after DOM is ready to avoid nulls
let navLinks = [];

let lastFetched = null;

function timeAgo(date){
  if(!date) return '—';
  const diff = Math.floor((Date.now() - date)/1000);
  if(diff < 60) return `${diff}s`;
  if(diff < 3600) return `${Math.floor(diff/60)}m`;
  return `${Math.floor(diff/3600)}h`;
}

async function fetchNews(){
  const q = qInput.value.trim();
  const country = countryInput.value;
  statusEl.textContent = 'Cargando…';
  refreshBtn.disabled = true;
  newsGrid.innerHTML = '';
  featureEl.innerHTML = '';
  emptyEl.style.display = 'none';

  try{
    const params = new URLSearchParams();
    if(q) params.set('q', q);
    if(country) params.set('country', country);
    params.set('pageSize', '24');

    const res = await fetch(`/api/news?${params.toString()}`);
    const data = await res.json();
    lastFetched = Date.now();
    refreshBtn.disabled = false;
    statusEl.textContent = `Actualizado hace ${timeAgo(lastFetched)}`;

    if(!data.articles || data.articles.length === 0){
      emptyEl.style.display = 'block';
      return;
    }

    // build featured (first article) and grid (rest)
    const articles = data.articles || [];
    if(articles.length === 0){
      emptyEl.style.display = 'block';
      return;
    }

    const first = articles[0];
    // Featured block
    const feat = document.createElement('div');
    feat.className = 'feature-card';
    if(first.urlToImage){
      const img = document.createElement('img');
      img.src = first.urlToImage;
      img.alt = first.title || 'featured image';
      feat.appendChild(img);
    }
    const fc = document.createElement('div');
    fc.className = 'feature-content';
    const kicker = document.createElement('div');
    kicker.className = 'kicker';
    kicker.textContent = first.source?.name || '';
    const ftitle = document.createElement('h2');
    ftitle.className = 'title';
    const flink = document.createElement('a');
    flink.href = first.url || '#';
    flink.target = '_blank';
    flink.rel = 'noopener noreferrer';
    flink.textContent = first.title || 'Sin título';
    flink.style.color = 'inherit';
    flink.style.textDecoration = 'none';
    ftitle.appendChild(flink);
    const excerpt = document.createElement('div');
    excerpt.className = 'excerpt';
    excerpt.textContent = first.description || '';
    const meta = document.createElement('div');
    meta.className = 'meta';
    const publishedAt = first.publishedAt ? new Date(first.publishedAt).toLocaleString() : '';
    meta.textContent = `${publishedAt}`;
    fc.appendChild(kicker);
    fc.appendChild(ftitle);
    fc.appendChild(excerpt);
    fc.appendChild(meta);
    feat.appendChild(fc);
    featureEl.appendChild(feat);

    // Grid for remaining
    const fragment = document.createDocumentFragment();
    articles.slice(1).forEach((a, idx) => {
      const card = document.createElement('article');
      card.className = 'card';
      // thumb
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      if(a.urlToImage){
        const img = document.createElement('img');
        img.src = a.urlToImage;
        img.alt = a.title || 'news image';
        thumb.appendChild(img);
      }
      card.appendChild(thumb);

      const kicker2 = document.createElement('div');
      kicker2.className = 'kicker';
      kicker2.textContent = a.source?.name || '';
      card.appendChild(kicker2);

      const title = document.createElement('h3');
      title.className = 'title';
      const link = document.createElement('a');
      link.href = a.url || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = a.title || 'Sin título';
      link.style.color = 'inherit';
      link.style.textDecoration = 'none';
      title.appendChild(link);
      card.appendChild(title);

      if(a.description){
        const desc = document.createElement('div');
        desc.className = 'desc';
        desc.textContent = a.description;
        card.appendChild(desc);
      }

      const metaRow = document.createElement('div');
      metaRow.className = 'meta-row';
      const src = document.createElement('span');
      src.className = 'source';
      src.textContent = a.source?.name || '';
      const published = document.createElement('span');
      const dt = a.publishedAt ? new Date(a.publishedAt) : null;
      published.textContent = dt ? `${dt.toLocaleString()}` : '';
      metaRow.appendChild(src);
      metaRow.appendChild(published);
      card.appendChild(metaRow);

      if(idx < 4) card.classList.add('fresh');
      fragment.appendChild(card);
    });

    newsGrid.appendChild(fragment);
    // after a short time remove fresh class
    setTimeout(()=>{
      document.querySelectorAll('.card.fresh').forEach(el=>el.classList.remove('fresh'));
    }, 2200);

  }catch(err){
    console.error(err);
    statusEl.textContent = 'Error cargando noticias';
    emptyEl.style.display = 'block';
  }
}

// Safe init: attach listeners when DOM is ready
function initListeners(){
  // form
  if(form) form.addEventListener('submit', (e)=>{ e.preventDefault(); fetchNews(); });
  if(refreshBtn) refreshBtn.addEventListener('click', fetchNews);

  // nav links: query now and attach listeners or use delegation
  navLinks = Array.from(document.querySelectorAll('.nav a'));
  if(navLinks.length > 0){
    navLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        // remove active from others
        navLinks.forEach(n => n.classList.remove('active'));
        a.classList.add('active');

        const q = a.dataset.q || '';
        if(qInput) qInput.value = q;
        if(countryInput) countryInput.value = '';
        fetchNews();
      });
    });
  } else {
    // fallback: delegation on body for dynamically added nav links
    document.body.addEventListener('click', (e)=>{
      const a = e.target.closest && e.target.closest('.nav a');
      if(!a) return;
      e.preventDefault();
      // update active class
      document.querySelectorAll('.nav a').forEach(n=>n.classList.remove('active'));
      a.classList.add('active');
      const q = a.dataset.q || '';
      if(qInput) qInput.value = q;
      if(countryInput) countryInput.value = '';
      fetchNews();
    });
  }
}

if(document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', initListeners);
} else {
  initListeners();
}

// actualización del contador de "hace"
setInterval(()=>{
  if(lastFetched){
    statusEl.textContent = `Actualizado hace ${timeAgo(lastFetched)}`;
  }
}, 1000);

// carga inicial con algunas noticias globales
window.addEventListener('load', ()=>{
  fetchNews();
});
