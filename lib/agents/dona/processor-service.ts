// agents/dona/processor-service.ts
import { supabase } from '@/lib/agents/supabase/client';
import { dona } from './processor';

type ProcessResult = {
  processedCount: number;
  errorCount: number;
  errors?: string[];
};

// ✅ Définir le type de retour
export type DonaServiceHandle = {
  stop: () => void;
};

export async function processPendingItems(): Promise<ProcessResult> {
  const result: ProcessResult = { processedCount: 0, errorCount: 0, errors: [] };

  try {
    console.log('🔄 DONA Service: Début du traitement...');

    // Récupérer les emails en attente
    const { data: emails, error: emailError } = await supabase
      .from('incoming_emails')
      .select('*')
      .eq('status', 'pending')
      .limit(50);

    if (emailError) {
      console.error('❌ DONA: Erreur emails:', emailError);
      result.errors?.push(`Email error: ${emailError.message}`);
    } else {
      console.log(`📧 DONA: ${emails?.length || 0} emails à traiter`);
    }

    // Récupérer les contacts en attente
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('status', 'pending')
      .limit(50);

    if (contactError) {
      console.error('❌ DONA: Erreur contacts:', contactError);
      result.errors?.push(`Contact error: ${contactError.message}`);
    } else {
      console.log(`📋 DONA: ${contacts?.length || 0} contacts à traiter`);
    }

    // Traiter les emails
    if (emails && emails.length > 0) {
      for (const email of emails) {
        try {
          const emailData = {
            id: email.id,
            from: email.from_email || 'unknown@example.com',
            to: email.to_email || 'doumbialayesoma@gmail.com',
            subject: email.subject || 'Sans sujet',
            body: email.body || ''
          };

          const resultProcess = await dona.processEmail(emailData);
          
          if (resultProcess.action === 'stored') {
            result.processedCount++;
          } else if (resultProcess.action === 'error') {
            result.errorCount++;
            result.errors?.push(`Email ${email.id}: ${resultProcess.error?.message}`);
          }
          
        } catch (error: any) {
          result.errorCount++;
          result.errors?.push(`Email ${email.id}: ${error.message}`);
          
          await supabase
            .from('incoming_emails')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', email.id);
        }
      }
    }

    // Traiter les contacts
    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        try {
          const contactData = {
            id: contact.id,
            name: contact.name || 'Anonyme',
            email: contact.email || 'unknown@example.com',
            subject: contact.subject || 'Sans sujet',
            message: contact.message || ''
          };

          const resultProcess = await dona.processContact(contactData);
          
          if (resultProcess.action === 'updated') {
            result.processedCount++;
          } else if (resultProcess.action === 'error') {
            result.errorCount++;
            result.errors?.push(`Contact ${contact.id}: ${resultProcess.error?.message}`);
          }
          
        } catch (error: any) {
          result.errorCount++;
          result.errors?.push(`Contact ${contact.id}: ${error.message}`);
          
          await supabase
            .from('contacts')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', contact.id);
        }
      }
    }

    console.log(`✅ DONA Service: ${result.processedCount} traités, ${result.errorCount} erreurs`);
    return result;

  } catch (error: any) {
    console.error('❌ DONA Service: Erreur fatale:', error.message);
    result.errorCount++;
    result.errors?.push(`Fatal: ${error.message}`);
    return result;
  }
}

// ✅ Retourne un objet avec une fonction stop()
export function startDonaService(interval: number = 60000): DonaServiceHandle {
  console.log(`🚀 DONA Service démarré (intervalle: ${interval / 1000}s)`);
  
  // Initialiser DONA
  dona.init();
  
  // Exécuter immédiatement
  processPendingItems();

  // Puis périodiquement
  const timer = setInterval(processPendingItems, interval);
  
  // ✅ Retourner un objet avec stop()
  return {
    stop: () => {
      clearInterval(timer);
      console.log('⏹️ DONA Service arrêté');
    }
  };
}