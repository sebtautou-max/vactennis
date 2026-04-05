/* ============================================
   VAC TENNIS — Main JS
   Style: Bleu Classique
   ============================================ */

// --- Mobile nav toggle ---
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.navbar-toggle');
  const links = document.querySelector('.navbar-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    // Close on link click
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  // --- Active nav link ---
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a:not(.btn)').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page) a.classList.add('active');
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// --- Actualités loader ---
async function loadActualites(containerId, limit = null) {
  try {
    const resp = await fetch('actualites/data.json');
    if (!resp.ok) return;
    let articles = await resp.json();
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (limit) articles = articles.slice(0, limit);

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = articles.map(art => `
      <div class="card actu-card">
        ${art.image ? `<div class="card-img" style="background-image:url(${art.image});background-size:cover;background-position:center;"></div>` : '<div class="card-img" style="background:#e0e8f0;display:flex;align-items:center;justify-content:center;"><span style="color:#7a8a9a;font-size:14px;">VAC Tennis</span></div>'}
        <div class="card-body">
          <span class="label">${art.categorie}</span>
          <h3>${art.titre}</h3>
          <span class="actu-date">${formatDate(art.date)}</span>
          <p class="text-muted">${art.extrait}</p>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.log('Actualités non disponibles');
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
