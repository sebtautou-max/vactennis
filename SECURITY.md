# Sécurité — VAC Tennis

Ce document récapitule les mesures de sécurité en place sur le site et les actions à réaliser dans les dashboards externes (GitHub, Cloudflare).

## Architecture & surface d'attaque

Le site est **statique** (HTML/CSS/JS, sans backend, sans base de données), ce qui élimine 90 % des attaques classiques (SQL injection, RCE, XSS serveur, etc.). Les vecteurs résiduels sont :

- Compromission du repo GitHub (push malveillant)
- Compromission du compte Cloudflare (DNS hijacking, redirection)
- Compromission du Decap CMS (publication malveillante via `site/actualites/`)
- Spam sur les formulaires HTML publics
- XSS via contenu malveillant injecté dans le CMS (mitigé par CSP)

---

## ✅ En place côté repo (déjà commité)

### 1. `site/_headers` — Headers HTTP de sécurité

Fichier servi par Cloudflare Pages, applique sur toutes les pages :

| Header | Rôle |
|--------|------|
| `Content-Security-Policy` | Restreint d'où peuvent être chargés scripts/styles/images/fonts. Bloque les XSS d'origine externe. |
| `Strict-Transport-Security` | Force HTTPS pour 2 ans, avec `includeSubDomains` et `preload`. |
| `X-Frame-Options: DENY` | Empêche d'embarquer le site dans une iframe externe (anti-clickjacking). |
| `X-Content-Type-Options: nosniff` | Bloque le MIME sniffing du navigateur. |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limite les fuites d'URL dans les referers. |
| `Permissions-Policy` | Désactive caméra, micro, géoloc, paiement, USB, accéléromètre, gyroscope. |

Un bloc CSP plus permissif est défini pour `/admin/*` (Decap CMS qui charge depuis `unpkg.com`).

### 2. Honeypot anti-spam sur le formulaire de la fête

`site/forms/fete-vac-tennis-28-juin.html` contient un champ caché `website-url` (display: none, off-screen). Les bots qui remplissent automatiquement tous les champs déclenchent le honeypot et la soumission est silencieusement rejetée (faux succès pour ne pas révéler la détection).

### 3. Workflow GitHub Actions de scan

`.github/workflows/security-scan.yml` lance à chaque push/PR et chaque lundi :

- **Gitleaks** — détecte les secrets accidentellement commités (clés API, tokens, mots de passe)
- **Trivy** — scan filesystem pour vulnérabilités CRITICAL/HIGH

### 4. Dependabot

`.github/dependabot.yml` met à jour automatiquement les versions des GitHub Actions chaque semaine (PR créée automatiquement).

### 5. CMS Decap déjà restreint

`site/admin/config.yml` :
- Backend GitHub limité au repo `sebtautou-max/vactennis`, branche `main` uniquement
- OAuth via un Worker Cloudflare custom (`oauth-proxy.sebtautou.workers.dev`) — pas de provider tiers
- Aucun changement nécessaire

---

## ⚠️ Actions à réaliser dans les dashboards (toi)

### GitHub

1. **2FA obligatoire sur ton compte personnel**
   `https://github.com/settings/security` → Two-factor authentication → **Set up using app** (TOTP) ou clé physique (YubiKey)
   _Si la 2FA n'est pas déjà active, c'est la priorité absolue._

2. **Branch protection sur `main`**
   `https://github.com/sebtautou-max/vactennis/settings/branches` → Add branch protection rule pour `main` :
   - ✅ Require a pull request before merging (avec 1 review)
   - ✅ Require status checks to pass (sélectionner les jobs du workflow security-scan)
   - ✅ Require conversation resolution before merging
   - ✅ Block force pushes
   - ✅ Block deletions
   - ✅ Do not allow bypassing the above settings (même pour admin)

3. **Active les alertes de sécurité**
   `https://github.com/sebtautou-max/vactennis/settings/security_analysis` :
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Secret scanning (public repos : déjà actif ; private : payant)

4. **Audite tes tokens & OAuth apps**
   `https://github.com/settings/tokens` → révoque ceux que tu ne reconnais pas ou qui n'ont pas servi récemment.
   `https://github.com/settings/applications` → idem pour les OAuth apps.

### Cloudflare

1. **2FA sur ton compte Cloudflare**
   `https://dash.cloudflare.com/profile/authentication` → Activate 2FA (TOTP ou clé physique).

2. **WAF — règles managées**
   Dashboard → ton domaine → Security → WAF → Managed rules → active :
   - Cloudflare Managed Ruleset (gratuit)
   - Cloudflare OWASP Core Ruleset (gratuit)

3. **Bot Fight Mode**
   Security → Bots → **Enable Bot Fight Mode** (gratuit).

4. **Rate limiting** (optionnel mais recommandé)
   Security → WAF → Rate limiting rules. Exemple : max 20 requêtes/min/IP sur `/admin/*`.

5. **HSTS preload**
   SSL/TLS → Edge Certificates → **Enable HSTS** :
   - Max-age: 6 months minimum
   - Apply HSTS policy to subdomains
   - Preload: ON
   - No-sniff: ON

6. **Always Use HTTPS**
   SSL/TLS → Edge Certificates → **Always Use HTTPS: ON**.

7. **DNSSEC**
   DNS → Settings → DNSSEC : Enable (suit l'assistant qui te donnera l'enregistrement DS à ajouter chez ton registrar).

8. **Audite les API tokens**
   `https://dash.cloudflare.com/profile/api-tokens` → révoque les tokens inutilisés.

---

## 🚨 En cas d'incident

L'avantage du site statique sur Git : chaque commit est un point de restauration.

### Push malveillant détecté

```bash
cd "/path/to/Site web VAC Tennis"
git log --oneline -20             # repérer le dernier bon commit
git revert <sha-du-commit-mauvais>  # crée un commit qui annule
git push origin main
```

Ou rollback direct via le dashboard Cloudflare Pages : "Deployments" → choisir un déploiement antérieur → "Rollback to this deployment".

### Compte GitHub compromis

1. Cloudflare dashboard → mettre le site en mode "Under Attack" (Security → Settings → Security Level)
2. GitHub : changer mot de passe + révoquer toutes les sessions actives (`https://github.com/settings/sessions`)
3. Auditer les commits récents, faire un `git reset --hard` au dernier commit légitime
4. Régénérer le token OAuth utilisé par le Worker Cloudflare (`oauth-proxy.sebtautou.workers.dev`)

### Spam massif via les formulaires

- Cloudflare WAF → ajouter une règle "Block" sur l'IP ou range concerné
- Activer Bot Fight Mode si pas déjà fait
- Ajouter un Cloudflare Turnstile (captcha) sur les formulaires (voir section suivante)

---

## 🔄 Améliorations futures (optionnelles)

- **Cloudflare Turnstile** sur les formulaires (captcha gratuit, sans Google). Nécessite de récupérer une site-key depuis le dashboard Cloudflare.
- **SRI (Subresource Integrity)** sur les ressources externes (Google Fonts) — protège contre la compromission de CDN.
- **Audit Lighthouse Security** régulier : `https://securityheaders.com` doit donner A ou A+.
- **Backup hebdo automatisé du repo** ailleurs (mirror sur GitLab par exemple).

---

## 🧪 Tester la configuration

Une fois `site/_headers` déployé, vérifier le score :

- `https://securityheaders.com/?q=vactennis.fr` — doit donner A+ après quelques minutes
- `https://observatory.mozilla.org/analyze/vactennis.fr` — analyse complète des headers
- `https://www.ssllabs.com/ssltest/analyze.html?d=vactennis.fr` — config TLS
- `https://hstspreload.org` — pour soumettre le domaine à la liste HSTS preload Chrome (après quelques semaines d'HSTS stable)

Si la CSP casse une fonctionnalité du site (par ex. un onmouseover JS bloqué), la console DevTools du navigateur indique précisément la directive à ajuster.
