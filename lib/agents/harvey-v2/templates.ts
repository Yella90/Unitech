// lib/agents/harvey-v2/templates.ts
// Templates d'emails professionnels pour Harvey V2

export interface EmailTemplateData {
  companyName: string;
  userName: string;
  userEmail?: string;
  subject: string;
  message: string;
  category: string;
  signature: string;
  logoUrl?: string | null;
  websiteUrl?: string;
  contactUrl?: string;
  projectData?: {
    name: string;
    slug: string;
    description: string;
    progress: number;
    status: string;
    images?: string[];
  };
  actions?: string[];
  attachments?: any[];
  metadata?: Record<string, any>;
}

export function generateEmailHtml(data: EmailTemplateData): string {
  const categoryColors: Record<string, string> = {
    support: '#3b82f6',
    commercial: '#f59e0b',
    project: '#22c55e',
    newsletter: '#a855f7',
    information: '#64748b',
    urgent: '#ef4444',
    technical: '#06b6d4',
    billing: '#8b5cf6',
    general: '#6b7280'
  };

  const categoryIcons: Record<string, string> = {
    support: '🛠️',
    commercial: '💼',
    project: '🚀',
    newsletter: '📬',
    information: 'ℹ️',
    urgent: '⚠️',
    technical: '⚙️',
    billing: '💰',
    general: '📌'
  };

  const color = categoryColors[data.category] || '#64748b';
  const icon = categoryIcons[data.category] || '📌';
  const website = data.websiteUrl || 'https://unitech-qvgo.onrender.com';
  const contact = data.contactUrl || `${website}/contact`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f7f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1E3A8A, #1E40AF); padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }
    .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin: 8px 0 0 0; }
    .category-badge { background: ${color}15; padding: 10px 40px; text-align: center; border-bottom: 2px solid ${color}; }
    .category-badge span { color: ${color}; font-weight: 600; font-size: 14px; }
    .content { padding: 40px; }
    .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .message-box p { color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .message-box .message { color: #0f172a; font-size: 14px; margin: 0; font-style: italic; }
    .response { margin-bottom: 24px; }
    .response p { color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; }
    .response .greeting { font-weight: 600; }
    .response .body-text { color: #1e293b; font-size: 14px; line-height: 1.8; margin: 0 0 16px 0; }
    .project-card { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .project-card .flex { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .project-card .info { flex: 1; min-width: 200px; }
    .project-card .info h3 { color: #166534; font-size: 16px; margin: 0 0 4px 0; }
    .project-card .info p { color: #15803d; font-size: 13px; margin: 0 0 8px 0; }
    .project-card .info .badge { background: #22c55e; color: white; padding: 2px 12px; border-radius: 12px; font-size: 11px; display: inline-block; }
    .project-card .info .progress { color: #15803d; font-size: 13px; }
    .project-card .info .link { background: #1E3A8A; color: white; padding: 6px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; display: inline-block; }
    .project-card .images { display: flex; gap: 8px; flex-wrap: wrap; }
    .project-card .images img { width: 80px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #86efac; }
    .actions { margin: 16px 0; }
    .actions .action-item { padding: 8px 12px; background: #f1f5f9; border-radius: 6px; margin: 4px 0; font-size: 13px; color: #1e293b; }
    .signature { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .signature p { color: #1e293b; font-size: 14px; margin: 0 0 4px 0; }
    .signature .name { font-weight: 600; }
    .footer { background: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { color: #64748b; font-size: 13px; margin: 0 0 8px 0; }
    .footer .links { color: #94a3b8; font-size: 12px; margin: 0; }
    .footer .links a { color: #1E3A8A; text-decoration: none; margin: 0 8px; }
    .footer .disclaimer { color: #94a3b8; font-size: 11px; margin: 8px 0 0 0; }
    @media (max-width: 600px) {
      .header { padding: 24px 20px; }
      .content { padding: 20px; }
      .project-card .flex { flex-direction: column; }
      .project-card .images img { width: 100%; height: auto; }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f9;padding:20px 0;">
    <tr>
      <td align="center">
        <div class="container">
          
          <!-- HEADER -->
          <div class="header">
            ${data.logoUrl ? `
              <img src="${data.logoUrl}" alt="${data.companyName}" style="max-height:60px;width:auto;margin-bottom:12px;" />
            ` : `
              <h1>${data.companyName}</h1>
            `}
            <p>Solutions technologiques innovantes</p>
          </div>
          
          <!-- CATEGORY BADGE -->
          <div class="category-badge">
            <span>${icon} ${data.category.charAt(0).toUpperCase() + data.category.slice(1)}</span>
          </div>
          
          <!-- CONTENT -->
          <div class="content">
            <!-- Message du client -->
            <div class="message-box">
              <p>Votre demande</p>
              <div class="message">"${data.message.substring(0, 300)}${data.message.length > 300 ? '...' : ''}"</div>
            </div>
            
            <!-- Réponse -->
            <div class="response">
              <p>
                <span class="greeting">Bonjour ${data.userName}</span>,
              </p>
              <div class="body-text">
                ${data.message}
              </div>
            </div>
            
            <!-- PROJECT CARD -->
            ${data.projectData ? `
              <div class="project-card">
                <div class="flex">
                  <div class="info">
                    <h3>${data.projectData.name}</h3>
                    ${data.projectData.description ? `<p>${data.projectData.description}</p>` : ''}
                    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:8px;">
                      ${data.projectData.status ? `<span class="badge">${data.projectData.status}</span>` : ''}
                      ${data.projectData.progress !== undefined ? `<span class="progress">Progression: ${data.projectData.progress}%</span>` : ''}
                      ${data.projectData.slug ? `
                        <a href="${website}/projects/${data.projectData.slug}" class="link">
                          Voir le projet →
                        </a>
                      ` : ''}
                    </div>
                  </div>
                  ${data.projectData.images && data.projectData.images.length > 0 ? `
                    <div class="images">
                      ${data.projectData.images.slice(0, 3).map(img => `
                        <img src="${img}" alt="${data.projectData?.name}" />
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            
            <!-- ACTIONS -->
            ${data.actions && data.actions.length > 0 ? `
              <div class="actions">
                <p style="font-weight:600;color:#1e293b;font-size:14px;margin:0 0 8px 0;">📌 Prochaines étapes suggérées :</p>
                ${data.actions.map(action => `
                  <div class="action-item">• ${action}</div>
                `).join('')}
              </div>
            ` : ''}
            
            <!-- SIGNATURE -->
            <div class="signature">
              <p>Cordialement,</p>
              <p><span class="name">${data.signature}</span></p>
            </div>
          </div>
          
          <!-- FOOTER -->
          <div class="footer">
            <p>${data.companyName} · Solutions technologiques</p>
            <div class="links">
              <a href="${website}">Site web</a>
              ·
              <a href="${contact}">Contact</a>
            </div>
            <div class="disclaimer">
              Cet email a été généré automatiquement. Pour toute question, contactez-nous.
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Templates textuels simples
export const textTemplates = {
  professional: (name: string, message: string, signature: string) => `
Bonjour ${name},

${message}

Dans l'attente de votre retour, je reste à votre disposition pour toute information complémentaire.

Cordialement,
${signature}
`,

  friendly: (name: string, message: string, signature: string) => `
Bonjour ${name},

${message}

Au plaisir d'échanger avec vous,
${signature}
`,

  technical: (name: string, message: string, signature: string) => `
Bonjour ${name},

${message}

Je reste à votre disposition pour toute précision technique.

Cordialement,
${signature}
`,

  concise: (name: string, message: string, signature: string) => `
${name},

${message}

${signature}
`
};