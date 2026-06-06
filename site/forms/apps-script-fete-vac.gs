/**
 * VAC Tennis — Backend du formulaire "Fête du Club 28 juin 2026"
 *
 * Comment l'utiliser :
 * 1. Va sur https://script.google.com → "+ Nouveau projet"
 * 2. Renomme le projet "VAC Fête 28 juin – Backend"
 * 3. Colle ce code à la place du `function myFunction()` par défaut
 * 4. Sauvegarde (Ctrl+S)
 * 5. Déploie : "Déployer" → "Nouveau déploiement" → ⚙ Type : "Application web"
 *    - Description : "VAC Fête 28 juin"
 *    - Exécuter en tant que : "Moi" (ton compte Google)
 *    - Qui a accès : "Tout le monde"
 *    - Clique "Déployer" → autorise les permissions demandées
 * 6. Copie l'URL "Application Web" affichée (format : https://script.google.com/macros/s/AKfyc.../exec)
 * 7. Colle cette URL dans `SCRIPT_URL` du fichier fete-vac-tennis-28-juin.html (ligne 791)
 *
 * À chaque modification du script, il faut redéployer ("Nouvelle version") pour que les
 * changements soient pris en compte côté web.
 */

// ── Config ─────────────────────────────────────────────
var SHEET_ID    = '1FRWxR4V7eEKDmXSOHPNl9FuIG4H_RESGpFs3eAh5fMY';
var SHEET_NAME  = 'Inscriptions'; // nom de l'onglet (le script le crée s'il n'existe pas)
var ADMIN_EMAIL = '';             // optionnel : laisse vide ou mets ton email pour recevoir une notif à chaque inscription

// ── Entrée HTTP POST ───────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Validation minimale côté serveur
    if (!data.nom || !data.prenom || !data.email) {
      return _json({ success: false, message: 'Champs obligatoires manquants.' });
    }
    if (!_isValidEmail(data.email)) {
      return _json({ success: false, message: 'Email invalide.' });
    }
    if (!data.rgpd) {
      return _json({ success: false, message: 'Le consentement RGPD est requis.' });
    }

    // Récup/création de l'onglet + en-têtes
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
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

    // Mise en forme des colonnes liste -> texte lisible
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

    // Notification email facultative
    if (ADMIN_EMAIL) {
      try {
        MailApp.sendEmail({
          to: ADMIN_EMAIL,
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
        // Si l'envoi mail échoue, on n'interrompt pas l'inscription
        Logger.log('Mail error: ' + mailErr);
      }
    }

    return _json({ success: true });

  } catch (err) {
    Logger.log('Erreur doPost : ' + err);
    return _json({ success: false, message: 'Erreur serveur : ' + err.message });
  }
}

// ── GET (pour pouvoir tester l'URL dans un navigateur) ─
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
