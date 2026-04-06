// Charge et affiche les actualités avec carousel
async function loadActualites() {
  const container = document.getElementById('actu-home');
  if (!container) return;

  try {
    const response = await fetch('https://api.github.com/repos/sebtautou-max/vactennis/contents/actualites');
    const files = await response.json();

    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    if (mdFiles.length === 0) {
      container.innerHTML = '<p class="text-muted">Aucune actualité pour le moment.</p>';
      return;
    }

    const actualites = await Promise.all(mdFiles.map(async (file) => {
      const res = await fetch(file.download_url);
      const text = await res.text();
      return parseMarkdown(text);
    }));

    actualites.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Remplace la grid par un carousel
    const section = container.closest('.section') || container.parentElement;
    container.style.display = 'none';

    const carouselId = 'actu-carousel';
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div id="${carouselId}" style="position:relative;">
        <div class="grid-3" id="actu-grid"></div>
        ${actualites.length > 3 ? `
        <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top:28px;">
          <button id="actu-prev" onclick="actuNav(-1)" style="
            width:44px; height:44px; border-radius:50%; border:2px solid #002e5d;
            background:#fff; color:#002e5d; font-size:20px; cursor:pointer;
            display:flex; align-items:center; justify-content:center;
            transition: all .2s;
          ">&#8249;</button>
          <span id="actu-counter" style="font-size:14px; color:#6a7a8a; font-family:'Inter',sans-serif;"></span>
          <button id="actu-next" onclick="actuNav(1)" style="
            width:44px; height:44px; border-radius:50%; border:2px solid #002e5d;
            background:#002e5d; color:#fff; font-size:20px; cursor:pointer;
            display:flex; align-items:center; justify-content:center;
            transition: all .2s;
          ">&#8250;</button>
        </div>` : ''}
      </div>
    `;
    container.parentElement.insertBefore(wrapper, container);

    // Stocke les actualités globalement pour la navigation
    window._actualites = actualites;
    window._actuPage = 0;
    window._actuPerPage = 3;

    renderActuPage(0);

  } catch (error) {
    console.error('Erreur chargement actualités:', error);
    container.innerHTML = '<p class="text-muted">Impossible de charger les actualités.</p>';
  }
}

function renderActuPage(page) {
  const grid = document.getElementById('actu-grid');
  const counter = document.getElementById('actu-counter');
  const prevBtn = document.getElementById('actu-prev');
  const nextBtn = document.getElementById('actu-next');
  if (!grid) return;

  const actualites = window._actualites;
  const perPage = window._actuPerPage;
  const totalPages = Math.ceil(actualites.length / perPage);
  const start = page * perPage;
  const items = actualites.slice(start, start + perPage);

  grid.innerHTML = items.map(actu => `
    <div class="card actu-card">
      ${actu.image
        ? `<div class="card-img" style="background-image: url('${actu.image}'); background-size: cover; background-position: center;"></div>`
        : `<div class="card-img" style="background: linear-gradient(135deg, #002e5d, #004a8f);"></div>`
      }
      <div class="card-body">
        ${actu.category ? `<span class="label">${actu.category}</span>` : ''}
        <h3>${actu.title}</h3>
        <span class="actu-date">${formatDate(actu.date)}</span>
        <p>${actu.excerpt}</p>
      </div>
    </div>
  `).join('');

  if (counter) counter.textContent = `${page + 1} / ${totalPages}`;
  if (prevBtn) prevBtn.style.opacity = page === 0 ? '0.3' : '1';
  if (nextBtn) nextBtn.style.opacity = page === totalPages - 1 ? '0.3' : '1';

  window._actuPage = page;
}

window.actuNav = function(dir) {
  const actualites = window._actualites;
  const perPage = window._actuPerPage;
  const totalPages = Math.ceil(actualites.length / perPage);
  const newPage = window._actuPage + dir;
  if (newPage >= 0 && newPage < totalPages) {
    renderActuPage(newPage);
  }
};

function parseMarkdown(text) {
  const lines = text.split('\n');
  const meta = {};
  let bodyStart = 0;
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (!inFrontmatter && i === 0) { inFrontmatter = true; continue; }
      else if (inFrontmatter) { bodyStart = i + 1; break; }
    }
    if (inFrontmatter) {
      const match = lines[i].match(/^(\w+):\s*(.+)$/);
      if (match) meta[match[1]] = match[2].trim();
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim();
  const excerpt = body.replace(/#{1,6}\s/g, '').substring(0, 150) + '...';

  return {
    title: meta.title || 'Sans titre',
    date: meta.date || '',
    image: meta.image || '',
    category: meta.category || '',
    excerpt: excerpt,
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', loadActualites);
