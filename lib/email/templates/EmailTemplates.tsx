// lib/email/templates/EmailTemplates.tsx

import { EmailTemplateData } from './types';

// ============================================================
// CATÉGORIE: SUPPORT
// ============================================================
function getSupportTemplate(data: EmailTemplateData): string {
  return `
    <div style="margin-bottom:24px;">
      <div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:8px;">
        <p style="color:#1e293b;font-size:15px;margin:0;font-weight:500;">🛠️ Support Technique</p>
        <p style="color:#475569;font-size:13px;margin:4px 0 0 0;">Réponse à votre demande d'assistance</p>
      </div>
    </div>
    
    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
      Bonjour <strong>${data.user_name}</strong>,
    </p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 4px 0;">Votre demande :</p>
      <p style="color:#0f172a;font-size:14px;margin:0;font-style:italic;">"${data.message}"</p>
    </div>
    
    ${data.project_images && data.project_images.length > 0 ? `
      <div style="margin-top:16px;">
        <p style="color:#475569;font-size:13px;font-weight:500;margin:0 0 12px 0;">📸 Ressources disponibles :</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${data.project_images.map(img => `
            <img src="${img}" style="width:120px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" />
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
      <p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0 0 12px 0;">
        ${data.message}
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px 0;">
        N'hésitez pas à nous contacter si vous avez besoin de plus d'informations.
      </p>
      <p style="color:#1e293b;font-size:14px;margin:16px 0 0 0;">
        Cordialement,<br>
        <strong>${data.signature || `L'équipe ${data.company_name}`}</strong>
      </p>
    </div>
  `;
}

// ============================================================
// CATÉGORIE: COMMERCIAL
// ============================================================
function getCommercialTemplate(data: EmailTemplateData): string {
  return `
    <div style="margin-bottom:24px;">
      <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:8px;">
        <p style="color:#1e293b;font-size:15px;margin:0;font-weight:500;">💼 Proposition Commerciale</p>
        <p style="color:#475569;font-size:13px;margin:4px 0 0 0;">Réponse à votre demande de devis</p>
      </div>
    </div>
    
    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
      Bonjour <strong>${data.user_name}</strong>,
    </p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 4px 0;">Votre demande :</p>
      <p style="color:#0f172a;font-size:14px;margin:0;font-style:italic;">"${data.message}"</p>
    </div>
    
    ${data.project_name ? `
      <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:1px solid #7dd3fc;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <h3 style="color:#0c4a6e;font-size:16px;margin:0 0 4px 0;">${data.project_name}</h3>
            <p style="color:#0369a1;font-size:13px;margin:0;">${data.project_description || ''}</p>
            <div style="margin-top:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <span style="background:#1E3A8A;color:white;padding:2px 12px;border-radius:12px;font-size:12px;">${data.project_status || 'En développement'}</span>
              <span style="color:#0369a1;font-size:13px;">Progression: ${data.project_progress || 0}%</span>
              ${data.project_slug ? `
                <a href="${data.links?.projects || '#'}/${data.project_slug}" style="color:#1E3A8A;font-size:13px;text-decoration:underline;">
                  Voir le projet →
                </a>
              ` : ''}
            </div>
          </div>
          ${data.project_images && data.project_images.length > 0 ? `
            <img src="${data.project_images[0]}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #7dd3fc;" />
          ` : ''}
        </div>
      </div>
    ` : ''}
    
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
      <p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0 0 12px 0;">
        ${data.message}
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px 0;">
        Nous restons à votre disposition pour toute information complémentaire.
      </p>
      <p style="color:#1e293b;font-size:14px;margin:16px 0 0 0;">
        Cordialement,<br>
        <strong>${data.signature || `L'équipe ${data.company_name}`}</strong>
      </p>
    </div>
  `;
}

// ============================================================
// CATÉGORIE: PROJET
// ============================================================
function getProjectTemplate(data: EmailTemplateData): string {
  return `
    <div style="margin-bottom:24px;">
      <div style="background-color:#f0fdf4;border-left:4px solid #22c55e;padding:16px 20px;border-radius:8px;">
        <p style="color:#1e293b;font-size:15px;margin:0;font-weight:500;">🚀 Suivi de Projet</p>
        <p style="color:#475569;font-size:13px;margin:4px 0 0 0;">Informations sur votre projet</p>
      </div>
    </div>
    
    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
      Bonjour <strong>${data.user_name}</strong>,
    </p>
    
    ${data.project_name ? `
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <h3 style="color:#166534;font-size:18px;margin:0 0 8px 0;">${data.project_name}</h3>
            <p style="color:#15803d;font-size:14px;margin:0 0 8px 0;">${data.project_description || ''}</p>
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="background:#22c55e;color:white;padding:2px 14px;border-radius:12px;font-size:12px;">${data.project_status || 'Actif'}</span>
                <span style="color:#15803d;font-size:13px;">${data.project_progress || 0}%</span>
              </div>
              ${data.project_slug ? `
                <a href="${data.links?.projects || '#'}/${data.project_slug}" style="background:#1E3A8A;color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:13px;display:inline-block;">
                  Voir le projet →
                </a>
              ` : ''}
            </div>
          </div>
          ${data.project_images && data.project_images.length > 0 ? `
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${data.project_images.slice(0, 2).map(img => `
                <img src="${img}" style="width:100px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #86efac;" />
              `).join('')}
              ${data.project_images.length > 2 ? `
                <span style="display:flex;align-items:center;justify-content:center;width:100px;height:70px;background:#f0fdf4;border-radius:8px;color:#15803d;font-size:12px;font-weight:500;">
                  +${data.project_images.length - 2}
                </span>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}
    
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
      <p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0 0 12px 0;">
        ${data.message}
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px 0;">
        Nous vous tiendrons informé de l'avancement du projet.
      </p>
      <p style="color:#1e293b;font-size:14px;margin:16px 0 0 0;">
        Cordialement,<br>
        <strong>${data.signature || `L'équipe ${data.company_name}`}</strong>
      </p>
    </div>
  `;
}

// ============================================================
// CATÉGORIE: NEWSLETTER
// ============================================================
function getNewsletterTemplate(data: EmailTemplateData): string {
  return `
    <div style="margin-bottom:24px;">
      <div style="background-color:#fdf4ff;border-left:4px solid #a855f7;padding:16px 20px;border-radius:8px;">
        <p style="color:#1e293b;font-size:15px;margin:0;font-weight:500;">📬 Newsletter</p>
        <p style="color:#475569;font-size:13px;margin:4px 0 0 0;">Actualités et nouveautés</p>
      </div>
    </div>
    
    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
      Bonjour <strong>${data.user_name}</strong>,
    </p>
    
    <div style="background:linear-gradient(135deg,#faf5ff,#f3e8ff);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:#6b21a8;font-size:16px;margin:0 0 8px 0;font-weight:600;">✨ Découvrez nos dernières actualités</p>
      <p style="color:#7e22ce;font-size:14px;margin:0;">
        ${data.message}
      </p>
    </div>
    
    ${data.project_images && data.project_images.length > 0 ? `
      <div style="margin-top:16px;">
        <p style="color:#475569;font-size:13px;font-weight:500;margin:0 0 12px 0;">📸 En images :</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${data.project_images.slice(0, 3).map(img => `
            <img src="${img}" style="width:160px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" />
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#1e293b;font-size:14px;margin:0 0 8px 0;">
        ${data.message}
      </p>
      <p style="color:#475569;font-size:13px;margin:0 0 8px 0;">
        Pour vous désabonner, cliquez <a href="#" style="color:#a855f7;text-decoration:underline;">ici</a>.
      </p>
      <p style="color:#1e293b;font-size:14px;margin:16px 0 0 0;">
        Cordialement,<br>
        <strong>${data.signature || `L'équipe ${data.company_name}`}</strong>
      </p>
    </div>
  `;
}

// ============================================================
// CATÉGORIE: INFORMATION
// ============================================================
function getInformationTemplate(data: EmailTemplateData): string {
  return `
    <div style="margin-bottom:24px;">
      <div style="background-color:#f1f5f9;border-left:4px solid #64748b;padding:16px 20px;border-radius:8px;">
        <p style="color:#1e293b;font-size:15px;margin:0;font-weight:500;">ℹ️ Information</p>
        <p style="color:#475569;font-size:13px;margin:4px 0 0 0;">Réponse à votre demande d'information</p>
      </div>
    </div>
    
    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
      Bonjour <strong>${data.user_name}</strong>,
    </p>
    
    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 4px 0;">Votre demande :</p>
      <p style="color:#0f172a;font-size:14px;margin:0;font-style:italic;">"${data.message}"</p>
    </div>
    
    ${data.project_images && data.project_images.length > 0 ? `
      <div style="margin-top:16px;">
        <p style="color:#475569;font-size:13px;font-weight:500;margin:0 0 12px 0;">📸 Images :</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${data.project_images.slice(0, 2).map(img => `
            <img src="${img}" style="width:150px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" />
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
      <p style="color:#1e293b;font-size:14px;line-height:1.6;margin:0 0 12px 0;">
        ${data.message}
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px 0;">
        Pour plus d'informations, n'hésitez pas à nous contacter.
      </p>
      <p style="color:#1e293b;font-size:14px;margin:16px 0 0 0;">
        Cordialement,<br>
        <strong>${data.signature || `L'équipe ${data.company_name}`}</strong>
      </p>
    </div>
  `;
}

// ============================================================
// HEADERS PAR CATÉGORIE
// ============================================================
export function getCategoryHeader(category: string): string {
  const headers: Record<string, string> = {
    support: `
      <tr>
        <td style="background:#eff6ff;padding:12px 40px;text-align:center;border-bottom:2px solid #3b82f6;">
          <span style="color:#1e40af;font-weight:600;font-size:14px;">🛠️ Assistance technique</span>
        </td>
      </tr>
    `,
    commercial: `
      <tr>
        <td style="background:#fffbeb;padding:12px 40px;text-align:center;border-bottom:2px solid #f59e0b;">
          <span style="color:#92400e;font-weight:600;font-size:14px;">💼 Proposition commerciale</span>
        </td>
      </tr>
    `,
    project: `
      <tr>
        <td style="background:#f0fdf4;padding:12px 40px;text-align:center;border-bottom:2px solid #22c55e;">
          <span style="color:#166534;font-weight:600;font-size:14px;">🚀 Suivi de projet</span>
        </td>
      </tr>
    `,
    newsletter: `
      <tr>
        <td style="background:#fdf4ff;padding:12px 40px;text-align:center;border-bottom:2px solid #a855f7;">
          <span style="color:#6b21a8;font-weight:600;font-size:14px;">📬 Newsletter</span>
        </td>
      </tr>
    `,
    information: `
      <tr>
        <td style="background:#f1f5f9;padding:12px 40px;text-align:center;border-bottom:2px solid #64748b;">
          <span style="color:#334155;font-weight:600;font-size:14px;">ℹ️ Information</span>
        </td>
      </tr>
    `,
  };
  
  return headers[category] || headers.information;
}

// ============================================================
// CONTENU PAR CATÉGORIE
// ============================================================
export function getCategoryContent(category: string, data: EmailTemplateData): string {
  const templates: Record<string, (data: EmailTemplateData) => string> = {
    support: getSupportTemplate,
    commercial: getCommercialTemplate,
    project: getProjectTemplate,
    newsletter: getNewsletterTemplate,
    information: getInformationTemplate,
  };
  
  const template = templates[category] || getInformationTemplate;
  return template(data);
}

// ============================================================
// TEMPLATE PRINCIPAL
// ============================================================
export function getEmailTemplate(category: string, data: EmailTemplateData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f9;padding:20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1E3A8A,#1E40AF);padding:32px 40px;text-align:center;">
                  ${data.logo_url ? `
                    <img src="${data.logo_url}" alt="${data.company_name}" style="max-height:60px;width:auto;margin-bottom:12px;" />
                  ` : `
                    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">${data.company_name}</h1>
                  `}
                  <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0 0;">Solutions technologiques innovantes</p>
                </td>
              </tr>
              
              <!-- Category Header -->
              ${getCategoryHeader(category)}
              
              <!-- Content -->
              <tr>
                <td style="padding:40px;">
                  ${getCategoryContent(category, data)}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="color:#64748b;font-size:13px;margin:0 0 8px 0;">
                    ${data.company_name} · Solutions technologiques
                  </p>
                  <p style="color:#94a3b8;font-size:12px;margin:0;">
                    <a href="${data.links?.website || '#'}" style="color:#1E3A8A;text-decoration:none;margin:0 8px;">Site web</a>
                    ·
                    <a href="${data.links?.contact || '#'}" style="color:#1E3A8A;text-decoration:none;margin:0 8px;">Contact</a>
                    ·
                    <a href="${data.links?.projects || '#'}" style="color:#1E3A8A;text-decoration:none;margin:0 8px;">Projets</a>
                  </p>
                  <p style="color:#94a3b8;font-size:11px;margin:8px 0 0 0;">
                    Cet email a été généré automatiquement. Pour toute question, contactez-nous.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}