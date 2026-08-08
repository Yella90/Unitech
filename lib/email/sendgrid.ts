// lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';
import { supabase } from '@/lib/supabase';
import { newsletterTemplate, confirmationTemplate, supportTemplate } from './templates';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@unitech.com';

sgMail.setApiKey(SENDGRID_API_KEY);

export interface EmailData {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  category?: string;
}

export async function sendEmail(data: EmailData) {
  try {
    const msg = {
      to: data.to,
      from: data.from || FROM_EMAIL,
      subject: data.subject,
      text: data.text || data.html?.replace(/<[^>]*>/g, '') || '',
      html: data.html || `<p>${data.text}</p>`,
      categories: data.category ? [data.category] : undefined,
    };

    const response = await sgMail.send(msg);
    console.log('✅ Email envoyé avec succès');

    await supabase.from('emails').insert({
      from_email: msg.from,
      to_email: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      body: data.text || data.html || '',
      category: data.category || 'other',
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { success: true, response };
  } catch (error) {
    console.error('❌ Erreur d\'envoi:', error);
    
    await supabase.from('emails').insert({
      from_email: data.from || FROM_EMAIL,
      to_email: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      body: data.text || data.html || '',
      status: 'error',
      category: data.category || 'other',
    });
    
    throw error;
  }
}

export async function sendEmailWithTemplate(
  to: string,
  templateType: 'newsletter' | 'confirmation' | 'support',
  data: any
) {
  try {
    const unsubscribeLink = `https://unitech.com/unsubscribe?email=${encodeURIComponent(to)}`;
    let html = '';
    let subject = '';

    switch (templateType) {
      case 'newsletter':
        html = newsletterTemplate(data.title, data.content, unsubscribeLink);
        subject = data.subject || '📬 Newsletter UNITECH';
        break;
      case 'confirmation':
        html = confirmationTemplate(data.name || 'utilisateur', unsubscribeLink);
        subject = '✅ Inscription confirmée - UNITECH';
        break;
      case 'support':
        html = supportTemplate(data.response, unsubscribeLink);
        subject = '📩 Réponse à votre demande - UNITECH';
        break;
      default:
        throw new Error('Template type non supporté');
    }

    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      html,
      categories: [templateType],
    };

    const response = await sgMail.send(msg);

    await supabase.from('emails').insert({
      from_email: FROM_EMAIL,
      to_email: to,
      subject,
      body: data.content || data.response || '',
      category: templateType,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { success: true, response };
  } catch (error) {
    console.error('❌ Erreur envoi template:', error);
    throw error;
  }
}