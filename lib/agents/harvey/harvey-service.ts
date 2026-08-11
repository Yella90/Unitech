// agents/harvey/harvey-service.ts
import { harvey } from './harvey';
import { supabase } from '@/lib/supabase';

let isRunning = false;

// ✅ Définir le type de retour
export type HarveyServiceHandle = {
  stop: () => void;
};

// ============================================================
// TRAITER LES CONTACTS EN ATTENTE
// ============================================================
async function processPendingContacts(limit: number = 5) {
  try {
    console.log(`🦸‍♂️ HARVEY: Traitement de ${limit} contacts en attente...`);

    // ✅ Récupérer les contacts en 'analyzed'
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('status', 'analyzed')
      .limit(limit);

    if (error) {
      console.error('❌ HARVEY: Erreur récupération contacts:', error);
      return { processed: 0, errors: 0 };
    }

    if (!contacts || contacts.length === 0) {
      console.log('📭 HARVEY: Aucun contact à traiter');
      return { processed: 0, errors: 0 };
    }

    console.log(`📋 HARVEY: ${contacts.length} contacts à traiter`);

    let processed = 0;
    let errors = 0;

    for (const contact of contacts) {
      try {
        // ✅ Générer une réponse pour le contact
        const response = await harvey.generateContactResponse(contact);
        if (response) {
          processed++;
          console.log(`✅ HARVEY: Contact ${contact.id} traité`);
        } else {
          errors++;
          console.log(`❌ HARVEY: Échec contact ${contact.id}`);
        }
      } catch (error: any) {
        errors++;
        console.error(`❌ HARVEY: Erreur contact ${contact.id}:`, error.message);
      }
    }

    console.log(`📊 HARVEY: ${processed} contacts traités, ${errors} erreurs`);
    return { processed, errors };

  } catch (error: any) {
    console.error('❌ HARVEY: Erreur fatale contacts:', error.message);
    return { processed: 0, errors: 1 };
  }
}

// ============================================================
// TRAITER LES EMAILS ET CONTACTS
// ============================================================
async function processAllPendingItems(limit: number = 5) {
  console.log('🦸‍♂️ HARVEY: Traitement des emails et contacts...');

  // ✅ Traiter les emails
  const emailResult = await harvey.processPendingEmails(limit);
  
  // ✅ Traiter les contacts
  const contactResult = await processPendingContacts(limit);

  const totalProcessed = emailResult.processed + contactResult.processed;
  const totalErrors = emailResult.errors + contactResult.errors;

  console.log(`📊 HARVEY: ${totalProcessed} traités (${emailResult.processed} emails, ${contactResult.processed} contacts), ${totalErrors} erreurs`);

  return {
    emails: emailResult,
    contacts: contactResult,
    total: {
      processed: totalProcessed,
      errors: totalErrors
    }
  };
}

// ============================================================
// DÉMARRER LE SERVICE
// ============================================================
export async function startHarveyService(interval: number = 60000): Promise<HarveyServiceHandle> {
  if (isRunning) {
    console.log('⚠️ HARVEY déjà en cours');
    return {
      stop: () => {
        console.log('⏹️ HARVEY déjà arrêté');
      }
    };
  }

  console.log(`🦸‍♂️ HARVEY Service démarré (intervalle: ${interval / 1000}s)`);
  console.log('📋 Traite les EMAILS et les CONTACTS');

  // ✅ Initialiser HARVEY
  await harvey.init();
  
  // ✅ Exécuter immédiatement (emails + contacts)
  console.log('🔄 HARVEY: Exécution immédiate...');
  await processAllPendingItems(5);

  // ✅ Puis périodiquement
  const timer = setInterval(async () => {
    try {
      console.log('🔄 HARVEY: Exécution périodique...');
      await processAllPendingItems(5);
    } catch (error: any) {
      console.error('❌ HARVEY Service error:', error.message);
    }
  }, interval);

  isRunning = true;

  return {
    stop: () => {
      clearInterval(timer);
      isRunning = false;
      console.log('⏹️ HARVEY Service arrêté');
    }
  };
}

// ============================================================
// DÉCLENCHER MANUELLEMENT
// ============================================================
export async function triggerHarveyProcessing(limit: number = 10) {
  console.log(`🦸‍♂️ HARVEY: Déclenchement manuel (${limit} emails + contacts)`);
  await harvey.init();
  const result = await processAllPendingItems(limit);
  console.log(`📊 HARVEY: ${result.total.processed} traités, ${result.total.errors} erreurs`);
  return result;
}