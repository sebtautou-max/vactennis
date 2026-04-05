# Déployer le site VAC Tennis sur Cloudflare Pages

## Prérequis
- Un compte Cloudflare gratuit (https://dash.cloudflare.com/sign-up)
- Le dossier `site/` contenant tous les fichiers du site

## Méthode 1 : Déploiement direct (le plus simple)

1. Connecte-toi sur https://dash.cloudflare.com
2. Dans le menu de gauche, clique sur **Workers & Pages**
3. Clique sur **Create** puis **Pages** puis **Upload assets**
4. Donne un nom au projet : `vactennis`
5. Glisse le contenu du dossier `site/` (tous les fichiers et sous-dossiers) dans la zone de dépôt
6. Clique **Deploy site**
7. Ton site est en ligne sur `vactennis.pages.dev`

## Méthode 2 : Via GitHub (recommandé pour les mises à jour)

1. Crée un compte GitHub (https://github.com) si ce n'est pas déjà fait
2. Crée un nouveau dépôt (repository) nommé `vactennis-site`
3. Pousse le contenu du dossier `site/` dans ce dépôt
4. Dans Cloudflare → Workers & Pages → Create → Pages → Connect to Git
5. Sélectionne ton dépôt `vactennis-site`
6. Configuration de build : laisse tout vide (pas besoin de commande de build)
7. Clique **Save and Deploy**

Avantage : chaque modification poussée sur GitHub déclenchera automatiquement un nouveau déploiement.

## Connecter le domaine vactennis.fr

1. Dans Cloudflare → ton projet Pages → **Custom domains**
2. Clique **Set up a custom domain**
3. Entre `vactennis.fr`
4. Cloudflare te demandera de configurer les DNS :
   - Si ton domaine est déjà chez Cloudflare DNS : c'est automatique
   - Sinon : ajoute un enregistrement CNAME pointant vers `vactennis.pages.dev`
5. Le certificat HTTPS sera généré automatiquement

## Gérer les actualités

Les actualités sont dans le fichier `actualites/data.json`. Pour ajouter un article :

1. Ouvre `actualites/data.json`
2. Ajoute un nouvel objet au début du tableau :
```json
{
  "slug": "mon-article",
  "titre": "Titre de l'article",
  "date": "2026-05-15",
  "categorie": "Vie du club",
  "image": "",
  "extrait": "Résumé court de l'article...",
  "contenu": "Contenu complet de l'article..."
}
```
3. Crée la page HTML correspondante dans `actualites/mon-article.html`
4. Redéploie le site (push GitHub ou re-upload sur Cloudflare)

## Structure des fichiers

```
site/
├── index.html              (Accueil)
├── le-club.html            (Le Club)
├── ecole-de-tennis.html    (École de Tennis)
├── competitions.html       (Compétitions)
├── equipe.html             (Équipe & Bureau)
├── inscriptions.html       (Inscriptions & Tarifs)
├── actualites.html         (Liste des actualités)
├── mentions-legales.html   (Mentions légales)
├── politique-confidentialite.html (Politique de confidentialité)
├── css/
│   └── style.css           (Feuille de style)
├── js/
│   └── main.js             (Navigation mobile + chargement actus)
├── img/                    (Photos à ajouter)
└── actualites/
    ├── data.json           (Base de données des articles)
    └── tournoi-open-2026.html (Article exemple)
```

## Coût total

| Élément | Coût |
|---|---|
| Cloudflare Pages | 0 €/mois |
| Domaine vactennis.fr | ~10-15 €/an (renouvellement) |
| **Total** | **~1 €/mois** |
