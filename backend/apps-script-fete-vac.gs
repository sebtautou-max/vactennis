/**
 * VAC Tennis — Backend du formulaire "Fête du Club 28 juin 2026"
 *
 * IMPORTANT : ce fichier est une COPIE DE RÉFÉRENCE pour le versioning.
 * Le code qui tourne réellement est dans l'éditeur Apps Script :
 *   https://script.google.com → projet "VAC Fête 28 juin – Backend"
 *
 * Pour reporter ces changements dans le projet réel :
 * 1. Ouvre l'éditeur Apps Script
 * 2. Remplace tout le code par celui-ci
 * 3. Sauve (Cmd+S)
 * 4. Configure les Script Properties (voir ci-dessous)
 * 5. Déploie : Déployer → Gérer les déploiements → ✏ Modifier → "Nouvelle version" → Déployer
 *
 * ─────────────────────────────────────────────────────────────
 * 🔑 SCRIPT PROPERTIES À CONFIGURER (une seule fois)
 * ─────────────────────────────────────────────────────────────
 * Dans l'éditeur Apps Script :
 *   1. Menu gauche → ⚙ Paramètres du projet
 *   2. Tout en bas, section "Propriétés du script"
 *   3. "+ Ajouter une propriété de script"
 *   4. Ajoute :
 *      - TURNSTILE_SECRET = <ta secret key Cloudflare Turnstile>
 *      - ADMIN_EMAIL      = contact@vactennis.fr (optionnel, notif inscription)
 *      - SHEET_ID         = 1FRWxR4V7eEKDmXSOHPNl9FuIG4H_RESGpFs3eAh5fMY
 *   5. "Enregistrer les propriétés"
 *
 * Avantage : les secrets ne sont JAMAIS dans le code commité sur Git.
 */

// ── Config (charge depuis Script Properties) ───────────
function _getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    sheetId         : props.getProperty('SHEET_ID')         || '1FRWxR4V7eEKDmXSOHPNl9FuIG4H_RESGpFs3eAh5fMY',
    sheetName       : 'Inscriptions',
    adminEmail      : props.getProperty('ADMIN_EMAIL')      || '',
    turnstileSecret : props.getProperty('TURNSTILE_SECRET') || ''
  };
}

// ── Entrée HTTP POST ───────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var cfg  = _getConfig();

    // ───── Vérification Cloudflare Turnstile ─────
    if (cfg.turnstileSecret) {
      if (!data.turnstileToken) {
        return _json({ success: false, message: 'Vérification anti-bot manquante. Rechargez la page et réessayez.' });
      }
      var verifyResp = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'post',
        payload: {
          secret: cfg.turnstileSecret,
          response: data.turnstileToken
        },
        muteHttpExceptions: true
      });
      var verifyResult = JSON.parse(verifyResp.getContentText());
      if (!verifyResult.success) {
        Logger.log('Turnstile failed: ' + JSON.stringify(verifyResult));
        return _json({ success: false, message: 'Vérification anti-bot échouée. Rechargez la page et réessayez.' });
      }
    }

    // ───── Validation des champs ─────
    if (!data.nom || !data.prenom || !data.email) {
      return _json({ success: false, message: 'Champs obligatoires manquants.' });
    }
    if (!_isValidEmail(data.email)) {
      return _json({ success: false, message: 'Email invalide.' });
    }
    if (!data.rgpd) {
      return _json({ success: false, message: 'Le consentement RGPD est requis.' });
    }

    // ───── Récup/création de l'onglet + en-têtes ─────
    var ss = SpreadsheetApp.openById(cfg.sheetId);
    var sheet = ss.getSheetByName(cfg.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.sheetName);
      sheet.appendRow([
        'Date', 'Nom', 'Prénom', 'Email',
        'Tennis ?', 'Joueurs tennis',
        'Déjeuner BBQ ?', 'Adultes BBQ', 'Enfants BBQ',
        'Apport',
        'RGPD', 'IP'
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#0e2352').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // ───── Mise en forme et écriture ─────
    var activite   = (data.activite   || []);
    var joueurs    = (data.joueurs    || []).join(' | ');
    var apport     = (data.apport     || []).join(' | ');
    var fitTennis  = activite.indexOf('tennis')   !== -1 ? 'Oui' : 'Non';
    var fitDejeun  = activite.indexOf('dejeuner') !== -1 ? 'Oui' : 'Non';

    sheet.appendRow([
      new Date(),
      data.nom,
      data.prenom,
      data.email,
      fitTennis,
      joueurs,
      fitDejeun,
      data.adultesBbq || 0,
      data.enfantsBbq || 0,
      apport,
      data.rgpd ? 'Oui' : 'Non',
      e && e.parameter ? (e.parameter.userIp || '') : ''
    ]);

    // ───── Notification email (optionnelle) ─────
    if (cfg.adminEmail) {
      try {
        MailApp.sendEmail({
          to: cfg.adminEmail,
          subject: 'VAC – Nouvelle inscription Fête 28 juin : ' + data.prenom + ' ' + data.nom,
          htmlBody:
            '<p>Nouvelle inscription à la Fête du club :</p>' +
            '<ul>' +
            '<li><b>Nom :</b> ' + data.nom + '</li>' +
            '<li><b>Prénom :</b> ' + data.prenom + '</li>' +
            '<li><b>Email :</b> ' + data.email + '</li>' +
            '<li><b>Tennis :</b> ' + fitTennis + (joueurs ? ' — ' + joueurs : '') + '</li>' +
            '<li><b>Déjeuner :</b> ' + fitDejeun + (fitDejeun === 'Oui' ? ' (' + (data.adultesBbq||0) + ' adultes, ' + (data.enfantsBbq||0) + ' enfants)' : '') + '</li>' +
            '<li><b>Apport :</b> ' + (apport || '—') + '</li>' +
            '</ul>'
        });
      } catch (mailErr) {
        Logger.log('Mail error: ' + mailErr);
      }
    }

    return _json({ success: true });

  } catch (err) {
    Logger.log('Erreur doPost : ' + err);
    return _json({ success: false, message: 'Erreur serveur : ' + err.message });
  }
}

// ── GET (pour tester l'URL dans un navigateur) ─────────
function doGet() {
  return _json({
    ok: true,
    service: 'VAC Fête 28 juin - backend',
    method: 'POST attendu en JSON',
    timestamp: new Date()
  });
}

// ── Helpers ────────────────────────────────────────────
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}
