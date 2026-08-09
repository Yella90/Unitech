// lib/email/smtp.ts
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp-unitech.alwaysdata.net';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER!;
const SMTP_PASS = process.env.SMTP_PASS!;
const FROM_EMAIL = process.env.FROM_EMAIL!;

// ✅ Créer le transporter SMTP
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export interface EmailData {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  category?: string;
}

// ✅ Envoyer un email
export async function sendEmail(data: EmailData) {
  try {
    const msg = {
      from: data.from || FROM_EMAIL,
      to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      text: data.text || data.html?.replace(/<[^>]*>/g, '') || '',
      html: data.html || `<p>${data.text}</p>`,
    };

    const info = await transporter.sendMail(msg);
    console.log('✅ Email envoyé avec succès:', info.messageId);

    await supabase.from('emails').insert({
      from_email: msg.from,
      to_email: msg.to,
      subject: data.subject,
      body: data.text || data.html || '',
      category: data.category || 'other',
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur d\'envoi:', error);
    throw error;
  }
}