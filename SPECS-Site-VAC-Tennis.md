# Spécifications — Nouveau site VAC Tennis sur Framer

**Version** : 1.0 — 2 avril 2026
**Auteur** : Claude (assistant IA) pour Sébastien Tautou
**Statut** : Draft — en attente de validation

---

## 1. Contexte et objectifs

Le Verneuil A.C. Tennis (VAC Tennis) souhaite migrer son site web depuis la plateforme de la ligue IDF (tennis-idf.fr/acverneuil) vers un site autonome sur **Framer** (plan Basic, 10€/mois). L'objectif est d'avoir un site moderne, simple à maintenir, et modifiable par programme via le **plugin MCP**.

**Site actuel** : https://vactennis.fr → redirige vers https://tennis-idf.fr/acverneuil/
**Nouveau domaine prévu** : vactennis.fr (domaine .com offert avec le plan Basic)

---

## 2. Contraintes techniques — Plan Basic Framer

| Paramètre | Limite |
|---|---|
| Pages (chaque URL unique) | 30 max |
| Collections CMS | 1 seule |
| Items CMS | 1 000 max |
| Bande passante | 10 Go/mois |
| Éditeurs | 1 + propriétaire |
| Formulaires | Illimité |
| Domaine personnalisé | 1 .com offert |

**Conséquence architecturale** : la collection CMS unique sera utilisée pour les **Actualités** (contenu le plus dynamique). Toutes les autres sections seront des **pages statiques** modifiables via le plugin MCP.

---

## 3. Architecture des pages

### 3.1 Arborescence (7 pages — bien sous la limite de 30)

```
vactennis.fr/
├── / ........................... Accueil (hero + résumé de chaque section)
├── /le-club ................... Présentation, infrastructures, accès
├── /equipe .................... Équipe pédagogique + Bureau
├── /inscriptions .............. Tarifs, formules, modalités
├── /ecole-de-tennis ........... Cours collectifs + Stages
├── /competitions .............. Tournois, championnats par équipes
├── /actualites ................ Actualités (CMS)
│   └── /actualites/[slug] ..... Articles individuels (CMS)
├── /mentions-legales .......... Mentions légales obligatoires
└── /politique-confidentialite . Politique de confidentialité / RGPD
```

**Total estimé** : 7 pages statiques + ~10-15 articles CMS = ~20 URLs (marge confortable sous les 30).

### 3.2 Navigation principale

```
[Logo VAC Tennis]   Le Club | École de Tennis | Compétitions | Inscriptions | Actualités   [CTA: S'inscrire]
```

Le lien "Équipe" et les mentions légales seront accessibles depuis le footer.

### 3.3 Footer commun

```
──────────────────────────────────────────────────────────
VAC Tennis — Gymnase Pierre de Coubertin
Rue Jean Zay, 78480 Verneuil-sur-Seine

📞 09 67 10 48 29 / 06 77 10 91 50
✉️ contact@vactennis.fr

[Facebook] [Instagram]

Équipe & Bureau | Mentions légales | Politique de confidentialité
──────────────────────────────────────────────────────────
```

---

## 4. Contenu détaillé par page

### 4.1 Page d'accueil ( / )

**Hero** : grande image de tennis + titre accrocheur + CTA "Découvrir le club" / "S'inscrire"

**Sections** :
- Présentation flash du club (2-3 phrases)
- Chiffres clés : 6 courts, ouvert 8h-22h 7j/7, depuis [année de création à confirmer]
- Aperçu des 3 dernières actualités (tiré du CMS)
- Bloc tarifs résumé avec CTA vers /inscriptions
- Carte Google Maps intégrée

### 4.2 Le Club ( /le-club )

**Présentation** :
- Association loi 1901, affiliée à la FFT, agréée Jeunesse et Sports
- Localisation : Gymnase Pierre de Coubertin, Rue Jean Zay, 78480 Verneuil-sur-Seine
- Accès ouvert aux adhérents de 8h à 22h, 7j/7

**Infrastructures** :
- 6 courts de tennis :
  - 2 courts résine couverts et éclairés (courts 1 & 2)
  - 2 courts terre artificielle (courts 3 & 4)
  - 2 courts béton poreux extérieur (courts 5 & 6)
- Club house avec bar, salon (fauteuils avec vue sur les courts, TV), vestiaires, douches, sanitaires
- Accès PMR, WiFi

**Réservation** : via la plateforme TenUp de la FFT (https://tenup.fft.fr/)

**Contact** :
- Tél : 09 67 10 48 29 / 06 77 10 91 50
- Email : contact@vactennis.fr
- Facebook : facebook.com/verneuilac.tennis
- Instagram : instagram.com/vac.tennis

### 4.3 Équipe ( /equipe )

**Équipe pédagogique** :

| Nom | Rôle | Qualifications |
|---|---|---|
| Valentin NICAULT | Directeur sportif | DEJEPS, au club depuis 2012 |
| [À compléter] | Enseignant(e) | Brevet d'État |
| [À compléter] | Enseignant(e) | Brevet d'État |

*Note : le site actuel ne liste que Valentin Nicault. Les autres enseignants sont mentionnés comme « tous brevetés d'État » sans noms. À compléter.*

**Le Bureau** :

| Nom | Fonction |
|---|---|
| Sébastien TAUTOU | Président |
| Christel MARIE | Secrétaire Général, Relation équipe enseignante |
| Gilles GAUTHIER | Relation comité/ligue, Sponsoring |
| Philippe VIOLLET | Trésorier, Gestion financière |
| Jérôme BOULERNE | Tournois, Juge-arbitre |
| Pascal LESSERTOIS | Jumelage |
| Sophie SAUVAGE | Intendance du Club |

### 4.4 Inscriptions ( /inscriptions )

**Saison** : 2025-2026

**Tarifs résidents de Verneuil-sur-Seine** :

| Formule | 4-6 ans | 7-15 ans | 16-18 ans | +18 ans |
|---|---|---|---|---|
| Licence FFT | 13€ | 23€ | 23€ | 33€ |
| Adhésion seule | — | 142€ | 172€ | 172€ |
| Adhésion + 30h école | — | 277€ | 357€ | 357€ |
| Adhésion + 60h école | — | 407€ | 537€ | 537€ |
| Baby & Mini Tennis | 187€ | — | — | — |

**Tarifs non-résidents** : majoration de +30€ sur l'adhésion.

**Avantages** :
- Réduction familiale : -10% à partir de 3 adhésions dans la même famille
- Paiement CB en 1 ou 3 fois via TenUp
- Aides acceptées : Pass+, Pass Sport, Coupons ANCV, aides CAF

**Documents requis (mineurs)** : attestation signée des personnes exerçant l'autorité parentale confirmant réponses négatives au questionnaire santé, ou certificat médical si réponse positive.

**Inscription en ligne** : https://tenup.fft.fr/

### 4.5 École de Tennis ( /ecole-de-tennis )

**Cours collectifs** :

*Baby & Mini Tennis (4-6 ans)* — Introduction ludique avec matériel adapté (balles mousse, petites raquettes, cibles). Développement de la coordination par ateliers jeux.

*Jeunes (7-15 ans)* — Apprentissage technique (coup droit, revers, service, volée, smash), tactique et qualités physiques. Groupes homogènes par niveau et âge.

*Adultes (16 ans et +)* — Enseignement adapté au niveau individuel, progression rapide, ambiance conviviale.

**Organisation** :
- Période : mi-septembre à fin juin (hors vacances scolaires)
- Horaires : en semaine après l'école, mercredis et samedis toute la journée
- Durée : cours de 1h ou 1h30, 1 à 2 fois/semaine
- Direction : Valentin Nicault (DEJEPS)

**Stages vacances** :

Proposés pendant chaque période de vacances scolaires (Toussaint, Noël, Février, Pâques, Juillet) pour les 4-18 ans, tous niveaux. Groupes homogènes.

| Formule | Tarif |
|---|---|
| 5 jours × 2h/jour | 120€ |
| 5 jours × 4h/jour | 220€ |

Stages adultes disponibles en soirée (groupes de 4 max). Horaires précisés par l'équipe pédagogique quelques semaines avant chaque stage.

**Contact** : Valentin NICAULT — 06 77 10 91 50 / contact@vactennis.fr

### 4.6 Compétitions ( /competitions )

**Tournoi OPEN annuel** :
- Dates 2026 : 18 avril — 10 mai 2026
- 5 épreuves, ouvert aux joueurs extérieurs
- Inscription via TenUp

**Tournoi interne adultes** :
- Saison 2025-2026 : 1er décembre 2025 — 21 juin 2026
- Ouvert à tous les adhérents (femmes et hommes)
- Inscription gratuite via TenUp ou SMS à Valentin

**Tournoi interne jeunes (9-18 ans)** :
- Format "Multi-Chances" (plusieurs matchs quel que soit le résultat)
- Organisé par groupes d'âge

**Championnats par équipes** :
- 4 équipes jeunes (garçons, 9-18 ans)
- 1 équipe femmes
- 2 équipes hommes toutes catégories
- 4 équipes hommes par âge (+35, +45, +55, +60)
- Matchs : mercredis (jeunes), samedis (femmes), dimanches (hommes)
- Sélection par les enseignants selon le niveau
- Résultats et calendrier consultables sur TenUp (Mon Club > Compétitions)

### 4.7 Actualités ( /actualites ) — CMS

**Collection CMS "Actualités"** avec les champs :
- Titre (texte)
- Slug (auto-généré)
- Date de publication (date)
- Image de couverture (image)
- Contenu (rich text)
- Catégorie (texte : "Tournoi", "Stage", "Vie du club", "Événement")

Page liste avec cards triées par date décroissante. Page détail avec le contenu complet.

### 4.8 Mentions légales ( /mentions-legales )

Conformément à la loi française (loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique), les mentions suivantes sont obligatoires :

**Éditeur du site** :
- Verneuil A.C. Tennis (VAC Tennis)
- Association loi 1901
- Siège social : Gymnase Pierre de Coubertin, Rue Jean Zay, 78480 Verneuil-sur-Seine
- Tél : 09 67 10 48 29
- Email : contact@vactennis.fr
- Directeur de la publication : Sébastien TAUTOU, Président
- [Numéro RNA / SIRET à compléter]

**Hébergeur** :
- Framer B.V.
- Keizersgracht 126, 1015 CW Amsterdam, Pays-Bas
- https://www.framer.com

**Propriété intellectuelle** : l'ensemble du contenu (textes, images, logos) est la propriété du VAC Tennis ou de ses partenaires. Toute reproduction sans autorisation est interdite.

**Responsabilité** : le VAC Tennis s'efforce de fournir des informations à jour mais ne peut garantir l'exactitude de l'ensemble du contenu. Le club ne saurait être tenu responsable des erreurs ou omissions.

**Crédits photos** : [À compléter — photographe(s) et/ou banques d'images]

### 4.9 Politique de confidentialité ( /politique-confidentialite )

Conformément au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée :

**Responsable du traitement** : Sébastien TAUTOU, Président du VAC Tennis

**Données collectées** :
- Via formulaire de contact : nom, prénom, email, téléphone, message
- Via inscription TenUp (traitement FFT, pas par le site)
- Données de navigation : cookies techniques (Framer), cookies analytiques (si activés)

**Finalités** : réponse aux demandes de contact, envoi d'informations sur les activités du club (avec consentement), gestion administrative de l'association.

**Base légale** : consentement (formulaires), intérêt légitime (gestion associative).

**Durée de conservation** : données de contact conservées 3 ans après le dernier échange ; données d'adhésion selon les obligations légales de l'association.

**Droits des utilisateurs** : accès, rectification, effacement, portabilité, opposition, limitation. Exercice par email à contact@vactennis.fr ou par courrier au siège.

**Cookies** : le site utilise des cookies strictement nécessaires au fonctionnement (Framer). Aucun cookie publicitaire. [Bandeau cookie à implémenter si analytics ajouté].

**Réclamation** : possibilité de saisir la CNIL (www.cnil.fr).

---

## 5. Stratégie d'intégration Framer — Plugin MCP

### 5.1 Approche retenue

Utilisation du **plugin MCP "MCP: AI Plugin"** (par Tommy D. Rossi) disponible gratuitement sur le Framer Marketplace. Ce plugin crée un tunnel WebSocket sécurisé entre le projet Framer ouvert dans le navigateur et Claude.

### 5.2 Setup (étapes pour Sébastien)

1. **Créer un compte Framer** et un nouveau projet (plan Basic)
2. **Installer le plugin MCP** depuis le Marketplace Framer : https://www.framer.com/marketplace/plugins/mcp/
3. **Ouvrir le plugin** dans le projet Framer — il affichera une URL de serveur MCP
4. **Configurer Claude Desktop** :
   - Ouvrir Settings → Developer → Edit config
   - Ajouter l'URL du serveur MCP fournie par le plugin
   - Redémarrer Claude Desktop
5. **Vérifier la connexion** : demander à Claude de lister les éléments du canvas

### 5.3 Capacités disponibles via MCP

- Créer et modifier des frames, textes, images sur le canvas
- Gérer les styles (couleurs, typographies)
- Créer et peupler la collection CMS "Actualités"
- Insérer des composants et code React personnalisé
- Modifier les paramètres du projet (redirections, code custom)
- Publier le site

### 5.4 Limites à connaître

- Le projet Framer doit rester **ouvert dans le navigateur** avec le plugin actif
- Timeout de **5 secondes** par requête (opérations atomiques nécessaires)
- **Une seule instance** par utilisateur Framer
- Chaque opération demande une **approbation explicite** côté client

### 5.5 Alternative — Server API (à explorer plus tard)

La Server API Framer (beta, février 2026) permettra de modifier le site sans ouvrir Framer, idéale pour automatiser les mises à jour d'actualités via webhook ou cron. À évaluer quand elle sortira de beta.

---

## 6. Éléments à fournir / décider

| # | Élément | Statut |
|---|---|---|
| 1 | Logo du club (fichier vectoriel SVG ou PNG haute résolution) | À fournir |
| 2 | Photos du club (courts, club house, événements) | À fournir |
| 3 | Noms des autres enseignants (équipe pédagogique) | À compléter |
| 4 | Numéro RNA et/ou SIRET de l'association | À fournir |
| 5 | Année de création du club | À confirmer |
| 6 | Crédits photos | À préciser |
| 7 | Choix de la charte graphique (couleurs, polices) | À définir ensemble |
| 8 | Confirmation : plan Basic suffisant (1 seule CMS) ou besoin Pro ? | À valider |
| 9 | Analytics : Google Analytics ou autre outil de suivi ? | À décider |
| 10 | Domaine : garder vactennis.fr ou nouveau domaine ? | À confirmer |

---

## 7. Prochaines étapes

1. **Sébastien valide** cette spec (ou demande des modifications)
2. **Sébastien crée** le projet Framer + installe le plugin MCP
3. **On définit ensemble** la charte graphique (couleurs, typo, style)
4. **Construction du site** page par page via le plugin MCP
5. **Migration du domaine** vactennis.fr vers Framer
6. **Test et mise en ligne**
