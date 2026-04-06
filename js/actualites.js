// Charge et affiche les actualités depuis le dossier actualites/
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

    // Trie par date décroissante
    actualites.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Affiche les 3 dernières actualités
    container.innerHTML = actualites.slice(0, 3).map(actu => `
      <div class="card actu-card">
        ${actu.image
          ? `<img class="card-img" src="${actu.image}" alt="${actu.title}">`
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

  } catch (error) {
    console.error('Erreur chargement actualités:', error);
    container.innerHTML = '<p class="text-muted">Impossible de charger les actualités.</p>';
  }
}

// Parse le frontmatter YAML et le contenu d'un fichier .md
function parseMarkdown(text) {
  const lines = text.split('\n');
  const meta = {};
  let bodyStart = 0;
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (!inFrontmatter && i === 0) {
        inFrontmatter = true;
        continue;
      } else if (inFrontmatter) {
        bodyStart = i + 1;
        break;
      }
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

// Formate une date en français
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', loadActualites);
