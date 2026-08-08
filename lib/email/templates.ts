// lib/email/templates.ts
export const emailTemplate = (content: string, unsubscribeLink: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UNITECH</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f7fb;
      color: #1e293b;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1E3A8A, #1E40AF);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .header p {
      color: rgba(255,255,255,0.8);
      margin: 5px 0 0;
      font-size: 14px;
    }
    .body-content {
      padding: 30px 30px 20px;
      line-height: 1.6;
    }
    .body-content h2 {
      color: #1E3A8A;
      margin-top: 0;
      font-size: 20px;
    }
    .body-content p {
      margin: 10px 0;
      font-size: 14px;
    }
    .body-content .highlight {
      background-color: #f0f4ff;
      padding: 15px;
      border-left: 4px solid #F97316;
      border-radius: 4px;
      margin: 15px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer a {
      color: #1E3A8A;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .unsubscribe {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
    }
    .unsubscribe a {
      color: #94a3b8;
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      background-color: #F97316;
      color: #ffffff;
      padding: 10px 25px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 10px 0;
    }
    .btn:hover {
      background-color: #ea580c;
    }
    @media only screen and (max-width: 480px) {
      .container {
        border-radius: 0;
      }
      .body-content {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 20px 10px; background-color: #f5f7fb;">
    <div class="container">
      <div class="header">
        <h1>🏢 UNITECH</h1>
        <p>Solutions technologiques innovantes</p>
      </div>
      <div class="body-content">
        ${content}
      </div>
      <div class="footer">
        <p>
          <strong>UNITECH</strong> - Solutions technologiques pour l'éducation, le commerce et l'énergie.
        </p>
        <p>
          📧 doumbialayesoma@gmail.com &nbsp;|&nbsp; 📞 +223 90692363
        </p>
        <p>
          <a href="https://unitech.com">unitech.com</a>
        </p>
        <div class="unsubscribe">
          <p>
            Vous recevez cet email car vous êtes inscrit(e) à la newsletter UNITECH.
            <br />
            <a href="${unsubscribeLink}" target="_blank">Se désabonner</a>
            &nbsp;|&nbsp;
            <a href="${unsubscribeLink.replace('unsubscribe', 'unsubscribe_preferences')}" target="_blank">Gérer mes préférences</a>
          </p>
          <p style="font-size: 10px; color: #94a3b8;">
            © ${new Date().getFullYear()} UNITECH. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const newsletterTemplate = (title: string, content: string, unsubscribeLink: string) => {
  const htmlContent = `
    <h2>📬 ${title}</h2>
    <p>Bonjour,</p>
    <div style="margin: 15px 0;">
      ${content}
    </div>
    <div class="highlight">
      <p style="margin: 0; font-size: 14px;">
        💡 <strong>Restez informé</strong> des dernières actualités et innovations de UNITECH.
      </p>
    </div>
    <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
      Cordialement,<br />
      <strong>L'équipe UNITECH</strong>
    </p>
  `;
  return emailTemplate(htmlContent, unsubscribeLink);
};

export const confirmationTemplate = (name: string, unsubscribeLink: string) => {
  const htmlContent = `
    <h2>✅ Inscription confirmée !</h2>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Nous vous confirmons votre inscription à la newsletter UNITECH.</p>
    <p>Vous recevrez désormais nos actualités, nos projets en cours et nos offres exclusives.</p>
    <div class="highlight">
      <p style="margin: 0; font-size: 14px;">
        🚀 <strong>Découvrez nos projets :</strong><br />
        <a href="https://unitech.com/projects" style="color: #F97316;">Voir les projets</a>
      </p>
    </div>
    <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
      Bienvenue chez UNITECH !<br />
      <strong>L'équipe UNITECH</strong>
    </p>
  `;
  return emailTemplate(htmlContent, unsubscribeLink);
};

export const supportTemplate = (response: string, unsubscribeLink: string) => {
  const htmlContent = `
    <h2>📩 Réponse à votre demande</h2>
    <p>Bonjour,</p>
    <p>Suite à votre demande, voici notre réponse :</p>
    <div class="highlight">
      <p style="margin: 0; font-size: 14px;">
        ${response}
      </p>
    </div>
    <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
      Besoin d'aide supplémentaire ?<br />
      <a href="https://unitech.com/contact" style="color: #F97316;">Contactez-nous</a>
    </p>
  `;
  return emailTemplate(htmlContent, unsubscribeLink);
};