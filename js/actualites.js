// Charge et affiche les actualités depuis le dossier actualites/
async function loadActualites() {
  const container = document.getElementById('actu-home');
  if (!container) return;

  try {
    // Récupère la liste des fichiers dans le dossier actualites/
    const response = await fetch('https://api.github.com/repos/sebtautou-max/vactennis/contents/actualites');
    const files = await response.json();

    // Filtre uniquement les fichiers .md
    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    if (mdFiles.length === 0) {
      container.innerHTML = '<p>Aucune actualité pour le moment.</p>';
      return;
    }

    // Charge le contenu de chaque fichier
    const actualites = await Promise.all(mdFiles.map(async (file) => {
      const res = await fetch(file.download_url);
      const text = await res.text();
      return parseMarkdown(text);
    }));

    // Trie par date décroissante
    actualites.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Affiche les 3 dernières actualités
    container.innerHTML = actualites.slice(0, 3).map(actu => `
      <div class="card">
        ${actu.image ? `<img src="${actu.image}" alt="${actu.title}" style="width:100%; border-radius:8px; margin-bottom:12px;">` : ''}
        <div class="card-content">
          <div class="card-date">${formatDate(actu.date)}</div>
          <h3>${actu.title}</h3>
          <p>${actu.excerpt}</p>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erreur chargement actualités:', error);
    container.innerHTML = '<p>Impossible de charger les actualités.</p>';
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
    excerpt: excerpt,
    body: body,
  };
}

// Formate une date en français
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Lance le chargement au démarrage
document.addEventListener('DOMContentLoaded', loadActualites);
