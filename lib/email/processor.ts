// lib/email/processor.ts
import { supabase } from '@/lib/supabase';
import { EmailAgent } from '@/lib/ia/email-agent';

const agent = new EmailAgent();

// ✅ Traiter les emails en attente
export async function processPendingEmails() {
  try {
    // 1. Récupérer les emails en attente
    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Erreur récupération emails:', error);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('📭 Aucun email en attente');
      return;
    }

    console.log(`📧 ${emails.length} emails en attente de traitement`);

    // 2. Traiter chaque email
    for (const email of emails) {
      try {
        // Vérifier si l'email peut être traité automatiquement
        const processed = await agent.autoProcess(email.id);
        
        if (processed) {
          console.log(`✅ Email ${email.id} traité automatiquement`);
        } else {
          console.log(`👤 Email ${email.id} nécessite une intervention humaine`);
        }
      } catch (error) {
        console.error(`❌ Erreur traitement email ${email.id}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ Erreur processPendingEmails:', error);
  }
}

// ✅ Démarrer le service de traitement périodique
export function startEmailProcessor(interval: number = 60000) {
  console.log('🚀 Service de traitement d\'emails démarré');
  
  // Exécuter immédiatement
  processPendingEmails();

  // Puis toutes les X minutes
  const timer = setInterval(processPendingEmails, interval);
  
  return {
    stop: () => {
      clearInterval(timer);
      console.log('⏹️ Service de traitement d\'emails arrêté');
    },
  };
}