// lib/dona/processor-service.ts
import { supabase } from '@/lib/supabase';
import { dona } from './processor-tfidf';

let isProcessing = false;

export async function processPendingItems() {
  if (isProcessing) {
    console.log('⏳ DONA déjà en cours de traitement...');
    return;
  }

  isProcessing = true;
  console.log('🔄 DONA TF-IDF: Début du traitement...');

  try {
    // Initialiser DONA
    await dona.init();

    // Récupérer les contacts en attente
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, email, subject, message')
      .eq('status', 'pending')
      .limit(10);

    if (contactError) {
      console.error('❌ Erreur contacts:', contactError);
    }

    if (contacts && contacts.length > 0) {
      console.log(`📋 ${contacts.length} contacts à traiter`);
      for (const contact of contacts) {
        try {
          await dona.processContact(contact);
        } catch (error) {
          console.error(`❌ Erreur contact ${contact.id}:`, error);
        }
      }
    }

    // Récupérer les emails en attente
    const { data: emails, error: emailError } = await supabase
      .from('incoming_emails')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    if (emailError) {
      if (emailError.code !== '42P01') {
        console.error('❌ Erreur emails:', emailError);
      }
    }

    if (emails && emails.length > 0) {
      console.log(`📧 ${emails.length} emails à traiter`);
      for (const email of emails) {
        try {
          await dona.processEmail(email);
        } catch (error) {
          console.error(`❌ Erreur email ${email.id}:`, error);
        }
      }
    }

    console.log(`✅ DONA TF-IDF: Traitement terminé`);

  } catch (error) {
    console.error('❌ Erreur DONA:', error);
  } finally {
    isProcessing = false;
  }
}

export function startDonaService(interval: number = 60000) {
  console.log(`🚀 Service DONA TF-IDF démarré (intervalle: ${interval}ms)`);
  
  dona.init();
  processPendingItems();
  
  const timer = setInterval(processPendingItems, interval);
  
  return {
    stop: () => {
      clearInterval(timer);
      console.log('⏹️ Service DONA TF-IDF arrêté');
    },
  };
}