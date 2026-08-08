// lib/dona/processor-service.ts
import { supabase } from '@/lib/supabase';
import { dona } from './processor';

// ✅ Traiter les emails en attente
export async function processPendingItems() {
  try {
    console.log('🔄 DONA: Début du traitement...');

    // 1. Récupérer les emails en attente
    const { data: emails, error: emailError } = await supabase
      .from('incoming_emails')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    if (emailError) {
      console.error('❌ Erreur emails:', emailError);
    }

    // 2. Récupérer les contacts en attente
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    if (contactError) {
      console.error('❌ Erreur contacts:', contactError);
    }

    // 3. Traiter les emails
    if (emails && emails.length > 0) {
      console.log(`📧 ${emails.length} emails à traiter`);
      for (const email of emails) {
        await dona.processEmail(email);
      }
    }

    // 4. Traiter les contacts
    if (contacts && contacts.length > 0) {
      console.log(`📋 ${contacts.length} contacts à traiter`);
      for (const contact of contacts) {
        await dona.processContact(contact);
      }
    }

    console.log('✅ DONA: Traitement terminé');

  } catch (error) {
    console.error('❌ Erreur DONA:', error);
  }
}

// ✅ Démarrer le service périodique
export function startDonaService(interval: number = 60000) {
  console.log(`🚀 Service DONA démarré (intervalle: ${interval}ms)`);
  
  // Charger la configuration au démarrage
  dona.loadConfig();

  // Exécuter immédiatement
  processPendingItems();

  // Puis toutes les X minutes
  const timer = setInterval(processPendingItems, interval);
  
  return {
    stop: () => {
      clearInterval(timer);
      console.log('⏹️ Service DONA arrêté');
    },
  };
}