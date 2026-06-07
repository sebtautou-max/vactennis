/**
 * VAC Tennis — Backend du formulaire "Fête du Club 28 juin 2026"
 *
 * Format de sortie aligné sur l'onglet "Inscriptions" du Google Sheet :
 *   Horodatage | Nom | Prénom | Email | Activité(s) | Joueurs tennis |
 *   Adultes BBQ | Enfants BBQ | Total BBQ | Apport(s) | Consentement RGPD
 *
 * IMPORTANT : ce fichier est une COPIE DE RÉFÉRENCE pour le versioning.
 * Le code qui tourne réellement est dans l'éditeur Apps Script :
 *   https://script.google.com → projet "VAC Fête 28 juin – Backend"
 *
 * Pour reporter ces changements dans le projet réel :
 * 1. Ouvre l'éditeur Apps Script
 * 2. Sélectionne tout le code → remplace par celui-ci
 * 3. Sauve (Cmd+S)
 * 4. Vérifie que les Script Properties existent (voir ci-dessous)
 * 5. Déploie : Déployer → Gérer les déploiements → ✏ Modifier → "Nouvelle version" → Déployer
 *
 * ─────────────────────────────────────────────────────────────
 * 🔑 SCRIPT PROPERTIES À CONFIGURER (une seule fois)
 * ─────────────────────────────────────────────────────────────
 * Dans l'éditeur Apps Script :
 *   1. Menu gauche → ⚙ Paramètres du projet
 *   2. Tout en bas, section "Propriétés du script"
 *   3. Ajoute :
 *      - TURNSTILE_SECRET = <secret key Cloudflare Turnstile> (facultatif)
 *      - ADMIN_EMAIL      = contact@vactennis.fr
 *      - SHEET_ID         = 1FRWxR4V7eEKDmXSOHPNl9FuIG4H_RESGpFs3eAh5fMY
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

    // ───── Vérification Cloudflare Turnstile (si secret configuré) ─────
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

    // ───── Ouverture de l'onglet (en-têtes déjà en place, on ne les recrée pas) ─────
    var ss = SpreadsheetApp.openById(cfg.sheetId);
    var sheet = ss.getSheetByName(cfg.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(cfg.sheetName);
      sheet.appendRow([
        'Horodatage', 'Nom', 'Prénom', 'Email',
        'Activité(s)', 'Joueurs tennis',
        'Adultes BBQ', 'Enfants BBQ', 'Total BBQ',
        'Apport(s)', 'Consentement RGPD'
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#0e2352').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // ───── Formatage des colonnes ─────
    var activiteList = (data.activite || []).map(function (a) {
      if (a === 'tennis')   return '🎾 Tennis';
      if (a === 'dejeuner') return '🍖 Barbecue';
      return a;
    }).join(', ');

    var joueurs    = (data.joueurs || []).join(', ');
    var apport     = (data.apport  || []).join(', ');
    var adultesBbq = parseInt(data.adultesBbq, 10) || 0;
    var enfantsBbq = parseInt(data.enfantsBbq, 10) || 0;
    var totalBbq   = adultesBbq + enfantsBbq;

    // ───── Écriture dans le Sheet ─────
    sheet.appendRow([
      new Date(),
      data.nom,
      data.prenom,
      data.email,
      activiteList,
      joueurs,
      adultesBbq,
      enfantsBbq,
      totalBbq,
      apport,
      data.rgpd ? '✅ Oui' : 'Non'
    ]);

    // ───── Notification email ─────
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
            '<li><b>Activité(s) :</b> ' + (activiteList || '—') + '</li>' +
            (joueurs    ? '<li><b>Joueurs tennis :</b> ' + joueurs + '</li>' : '') +
            (totalBbq>0 ? '<li><b>BBQ :</b> ' + adultesBbq + ' adultes + ' + enfantsBbq + ' enfants (' + totalBbq + ' total)</li>' : '') +
            (apport     ? '<li><b>Apport(s) :</b> ' + apport + '</li>' : '') +
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
