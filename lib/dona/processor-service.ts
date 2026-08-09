// lib/dona/processor-service.ts
import { supabase } from '@/lib/supabase';
import { dona } from './processor';

// ✅ Types pour les résultats
type ProcessResult = {
  processedCount: number;
  errorCount: number;
  errors?: string[];
};

// ✅ Traiter les emails ET les contacts en attente
export async function processPendingItems(): Promise<ProcessResult> {
  const result: ProcessResult = {
    processedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    console.log('🔄 DONA: Début du traitement...');
    console.log(`📅 ${new Date().toISOString()}`);

    // 1️⃣ Récupérer les EMAILS en attente
    const { data: emails, error: emailError } = await supabase
      .from('incoming_emails')
      .select('*')
      .eq('status', 'pending')
      .limit(50);

    if (emailError) {
      console.error('❌ Erreur récupération emails:', emailError);
      result.errors?.push(`Email error: ${emailError.message}`);
    } else {
      console.log(`📧 ${emails?.length || 0} emails à traiter`);
    }

    // 2️⃣ Récupérer les CONTACTS en attente
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('status', 'pending')
      .limit(50);

    if (contactError) {
      console.error('❌ Erreur récupération contacts:', contactError);
      result.errors?.push(`Contact error: ${contactError.message}`);
    } else {
      console.log(`📋 ${contacts?.length || 0} contacts à traiter`);
    }

    // 3️⃣ Traiter les EMAILS
    if (emails && emails.length > 0) {
      console.log(`📧 Traitement de ${emails.length} emails...`);
      
      for (const email of emails) {
        try {
          if (!email.body && !email.subject) {
            console.log(`⚠️ Email ${email.id} ignoré (body vide)`);
            await supabase
              .from('incoming_emails')
              .update({ status: 'ignored', updated_at: new Date().toISOString() })
              .eq('id', email.id);
            continue;
          }

          const emailData = {
            from: email.from_email || 'unknown@example.com',
            to: email.to_email || 'doumbialayesoma@gmail.com',
            subject: email.subject || 'Sans sujet',
            body: email.body || ''
          };

          // ✅ Appeler DONA avec gestion d'erreur
          const processResult = await dona.processEmail(emailData);
          
          // ✅ Vérifier que processResult existe et a la bonne structure
          if (processResult && typeof processResult === 'object') {
            if (processResult.action === 'stored' && processResult.analysis) {
              result.processedCount++;
              console.log(`✅ Email ${email.id} classé: ${processResult.analysis.category}`);
            } else if (processResult.action === 'ignored') {
              const reason = processResult.reason || 'inconnue';
              console.log(`🚫 Email ${email.id} ignoré (${reason})`);
            } else if (processResult.action === 'error') {
              result.errorCount++;
              const errorMsg = processResult.error?.message || 'Erreur inconnue';
              console.error(`❌ Erreur email ${email.id}:`, errorMsg);
              result.errors?.push(`Email ${email.id}: ${errorMsg}`);
            }
          } else {
            console.error(`❌ Résultat inattendu pour l'email ${email.id}`);
            result.errorCount++;
          }
          
        } catch (error: unknown) {
          result.errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          console.error(`❌ Erreur traitement email ${email.id}:`, errorMessage);
          result.errors?.push(`Email ${email.id}: ${errorMessage}`);
          
          await supabase
            .from('incoming_emails')
            .update({ 
              status: 'error', 
              updated_at: new Date().toISOString(),
              ai_analysis: { error: errorMessage }
            })
            .eq('id', email.id);
        }
      }
    }

    // 4️⃣ Traiter les CONTACTS
    if (contacts && contacts.length > 0) {
      console.log(`📋 Traitement de ${contacts.length} contacts...`);
      
      for (const contact of contacts) {
        try {
          if (!contact.message && !contact.subject) {
            console.log(`⚠️ Contact ${contact.id} ignoré (message vide)`);
            await supabase
              .from('contacts')
              .update({ status: 'ignored', updated_at: new Date().toISOString() })
              .eq('id', contact.id);
            continue;
          }

          const contactData = {
            id: contact.id,
            name: contact.name || 'Anonyme',
            email: contact.email || 'unknown@example.com',
            subject: contact.subject || 'Sans sujet',
            message: contact.message || ''
          };

          // ✅ Appeler DONA avec gestion d'erreur
          const processResult = await dona.processContact(contactData);
          
          // ✅ Vérifier que processResult existe et a la bonne structure
          if (processResult && typeof processResult === 'object') {
            if (processResult.action === 'updated' && processResult.analysis) {
              result.processedCount++;
              console.log(`✅ Contact ${contact.id} classé: ${processResult.analysis.category}`);
            } else if (processResult.action === 'error') {
              result.errorCount++;
              const errorMsg = processResult.error?.message || 'Erreur inconnue';
              console.error(`❌ Erreur contact ${contact.id}:`, errorMsg);
              result.errors?.push(`Contact ${contact.id}: ${errorMsg}`);
            }
          } else {
            console.error(`❌ Résultat inattendu pour le contact ${contact.id}`);
            result.errorCount++;
          }
          
        } catch (error: unknown) {
          result.errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          console.error(`❌ Erreur traitement contact ${contact.id}:`, errorMessage);
          result.errors?.push(`Contact ${contact.id}: ${errorMessage}`);
          
          await supabase
            .from('contacts')
            .update({ 
              status: 'error', 
              updated_at: new Date().toISOString()
            })
            .eq('id', contact.id);
        }
      }
    }

    // 5️⃣ Bilan
    console.log(`✅ DONA: Traitement terminé`);
    console.log(`📊 Bilan: ${result.processedCount} traités, ${result.errorCount} erreurs`);
    
    if (result.errors && result.errors.length > 0) {
      console.log(`⚠️ Détails des erreurs:`, result.errors);
    }

    return result;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur DONA:', errorMessage);
    result.errorCount++;
    result.errors?.push(`Fatal: ${errorMessage}`);
    return result;
  }
}

// ✅ Démarrer le service périodique
export function startDonaService(interval: number = 60000) {
  console.log(`🚀 Service DONA démarré (intervalle: ${interval / 1000}s)`);
  console.log('📋 Traite les EMAILS et les CONTACTS');
  
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