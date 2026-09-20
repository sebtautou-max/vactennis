/**
 * VAC Tennis — Backend du formulaire "Fête du Club 4 octobre 2026"
 *
 * Comportement : 1 email = 1 ligne. Une nouvelle soumission avec un email
 * déjà présent MET À JOUR la ligne existante au lieu d'en ajouter une.
 *
 * Format de sortie aligné sur l'onglet "Inscriptions" du Google Sheet :
 *   Horodatage | Nom | Prénom | Email | Activité(s) | Joueurs tennis |
 *   Adultes BBQ | Enfants BBQ | Total BBQ | Apport(s) | Consentement RGPD
 *
 * IMPORTANT : ce fichier est une COPIE DE RÉFÉRENCE pour le versioning.
 * Le code qui tourne réellement est dans l'éditeur Apps Script :
 *   https://script.google.com → projet "VAC Fête 4 octobre – Backend"
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

    // ───── Écriture dans le Sheet (1 email = 1 ligne) ─────
    // Un adhérent qui se réinscrit avec le même email met à jour sa ligne
    // au lieu d'en créer une seconde : cela évite les doublons quand une
    // soumission aboutit côté serveur mais que le navigateur ne voit pas
    // la réponse (extension, réseau coupé…), et permet de corriger son
    // nombre de convives sans nous écrire.
    var ligne = [
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
    ];

    // Verrou : deux inscriptions simultanées ne doivent pas se marcher dessus
    // (la recherche puis l'écriture forment une opération qui doit rester entière).
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(20000);
    } catch (lockErr) {
      Logger.log('Lock timeout : ' + lockErr);
      return _json({ success: false, message: 'Le serveur est occupé. Réessayez dans quelques secondes.' });
    }

    var miseAJour = false;
    try {
      var ligneExistante = _trouverLigneParEmail(sheet, data.email);
      if (ligneExistante > 0) {
        sheet.getRange(ligneExistante, 1, 1, ligne.length).setValues([ligne]);
        miseAJour = true;
      } else {
        sheet.appendRow(ligne);
      }
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    // ───── Notification email ─────
    if (cfg.adminEmail) {
      try {
        MailApp.sendEmail({
          to: cfg.adminEmail,
          subject: 'VAC – ' + (miseAJour ? 'Inscription modifiée' : 'Nouvelle inscription') +
                   ' Fête 4 octobre : ' + data.prenom + ' ' + data.nom,
          htmlBody:
            '<p>' + (miseAJour
              ? 'Inscription <b>mise à jour</b> (même email, ligne remplacée) :'
              : 'Nouvelle inscription à la Fête du club :') + '</p>' +
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

    return _json({ success: true, updated: miseAJour });

  } catch (err) {
    Logger.log('Erreur doPost : ' + err);
    return _json({ success: false, message: 'Erreur serveur : ' + err.message });
  }
}

// ── GET (pour tester l'URL dans un navigateur) ─────────
function doGet() {
  return _json({
    ok: true,
    service: 'VAC Fête 4 octobre - backend',
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

// Renvoie le numéro de ligne d'une inscription portant cet email, 0 sinon.
// Colonne D = Email. En cas de doublons hérités, la dernière ligne gagne.
function _trouverLigneParEmail(sheet, email) {
  var cible = String(email || '').trim().toLowerCase();
  if (!cible) return 0;
  var derniere = sheet.getLastRow();
  if (derniere < 2) return 0;
  var emails = sheet.getRange(2, 4, derniere - 1, 1).getValues();
  var trouvee = 0;
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === cible) trouvee = i + 2;
  }
  return trouvee;
}

function _isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

// ══════════════════════════════════════════════════════════
//  OUTILLAGE DU CLASSEUR — à lancer UNE FOIS depuis l'éditeur
//  (menu déroulant des fonctions → preparerClasseur → Exécuter)
//
//  1. renomme le classeur pour la fête du 4 octobre
//  2. (re)construit l'onglet « Synthèse » avec de VRAIES formules,
//     qui se recalculent toutes seules à chaque inscription.
//     Plus aucun script à relancer ensuite.
// ══════════════════════════════════════════════════════════
function preparerClasseur() {
  var cfg = _getConfig();
  var ss  = SpreadsheetApp.openById(cfg.sheetId);

  ss.rename('Inscriptions Fête VAC Tennis — 4 octobre 2026');
  var res = construireSynthese();

  Logger.log('Classeur renommé et onglet Synthèse reconstruit (' + res + ').');
  return 'OK';
}

function construireSynthese() {
  var cfg = _getConfig();
  var ss  = SpreadsheetApp.openById(cfg.sheetId);

  // L'onglet des inscriptions doit exister pour que les formules pointent quelque part
  var src = ss.getSheetByName(cfg.sheetName);
  if (!src) {
    throw new Error('Onglet "' + cfg.sheetName + '" introuvable : crée-le avant de lancer cette fonction.');
  }

  var sh = ss.getSheetByName('Synthèse');
  if (!sh) sh = ss.insertSheet('Synthèse', ss.getSheets().length);
  sh.clear();
  sh.clearFormats();

  var N = cfg.sheetName; // nom de l'onglet source, utilisé dans les formules

  // [ libellé, formule (ou null si c'est un intertitre) ]
  var lignes = [
    ['TITRE',  '🎾 VAC TENNIS — Fête du Club 04/10/2026'],
    ['SOUS',   '=IF(B4=0,"Aucune inscription pour l\'instant","Dernière inscription le "&TEXT(MAX(' + N + '!A2:A),"dd/mm/yyyy")&" à "&TEXT(MAX(' + N + '!A2:A),"HH:mm"))'],
    ['SECTION','— INSCRIPTIONS —'],
    ['Réponses reçues',        '=COUNTA(' + N + '!B2:B)'],
    ['SECTION','— 🎾 TENNIS —'],
    ['Inscrit·es tennis',      '=COUNTIF(' + N + '!E2:E,"*Tennis*")'],
    ['Joueur·ses nominé·es',   '=IF(COUNTA(' + N + '!F2:F)=0,0,SUM(ARRAYFORMULA(IF(' + N + '!F2:F="",0,LEN(' + N + '!F2:F)-LEN(SUBSTITUTE(' + N + '!F2:F,",",""))+1))))'],
    ['SECTION','— 🍖 BARBECUE —'],
    ['Inscrit·es barbecue',    '=COUNTIF(' + N + '!E2:E,"*Barbecue*")'],
    ['Convives total',         '=SUM(' + N + '!I2:I)'],
    ['dont Adultes',           '=SUM(' + N + '!G2:G)'],
    ['dont Enfants',           '=SUM(' + N + '!H2:H)'],
    ['SECTION','— CUMUL —'],
    ['Tennis uniquement',      '=B6-B16'],
    ['Barbecue uniquement',    '=B9-B16'],
    ['🎾🍖 Les deux',          '=B6+B9-B4'],
    ['SECTION','— APPORTS —'],
    ['🥗 Salade',              '=COUNTIF(' + N + '!J2:J,"*Salade*")'],
    ['🥧 Quiche',              '=COUNTIF(' + N + '!J2:J,"*Quiche*")'],
    ['🧀 Fromage',             '=COUNTIF(' + N + '!J2:J,"*Fromage*")'],
    ['🍓 Fruits',              '=COUNTIF(' + N + '!J2:J,"*Fruits*")'],
    ['🎂 Gâteau',              '=COUNTIF(' + N + '!J2:J,"*Gateau*")'],
    ['🍱 Autre',               '=COUNTIF(' + N + '!J2:J,"*Autre*")']
  ];

  var NAVY = '#0e2352', BLEU = '#2d8fe8', CLAIR = '#f4f8ff';

  for (var i = 0; i < lignes.length; i++) {
    var r = i + 1, type = lignes[i][0], val = lignes[i][1];

    if (type === 'TITRE') {
      sh.getRange(r, 1, 1, 2).merge().setValue(val)
        .setBackground(NAVY).setFontColor('#ffffff')
        .setFontWeight('bold').setFontSize(13)
        .setHorizontalAlignment('center').setVerticalAlignment('middle');
      sh.setRowHeight(r, 38);

    } else if (type === 'SOUS') {
      sh.getRange(r, 1, 1, 2).merge().setFormula(val)
        .setFontStyle('italic').setFontColor('#6a7a8a').setFontSize(9)
        .setHorizontalAlignment('center');

    } else if (type === 'SECTION') {
      sh.getRange(r, 1, 1, 2).merge().setValue(val)
        .setBackground(BLEU).setFontColor('#ffffff')
        .setFontWeight('bold').setFontSize(10)
        .setHorizontalAlignment('center');

    } else {
      sh.getRange(r, 1).setValue('  ' + type).setFontSize(11);
      sh.getRange(r, 2).setFormula(val)
        .setFontWeight('bold').setFontSize(11)
        .setHorizontalAlignment('center');
      if (i % 2 === 0) sh.getRange(r, 1, 1, 2).setBackground(CLAIR);
    }
  }

  sh.setColumnWidth(1, 300);
  sh.setColumnWidth(2, 110);
  sh.getRange(1, 1, lignes.length, 2)
    .setBorder(true, true, true, true, true, true, '#d7e3f4', SpreadsheetApp.BorderStyle.SOLID);
  if (sh.getMaxColumns() > 2) sh.deleteColumns(3, sh.getMaxColumns() - 2);
  if (sh.getMaxRows() > lignes.length) sh.deleteRows(lignes.length + 1, sh.getMaxRows() - lignes.length);
  ss.setActiveSheet(sh);
  SpreadsheetApp.flush();

  return lignes.length + ' lignes';
}
