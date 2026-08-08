// lib/email/processor-optimized.ts
import { supabase } from '@/lib/supabase';
import { AgentDona } from '@/lib/agents/dona';

const dona = new AgentDona();

// ✅ Traiter un email entrant (callback webhook)
export async function processIncomingEmail(emailData: {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
}) {
  try {
    // 1. DONA analyse l'email
    const analysis = await dona.quickAnalyze(emailData);
    
    // 2. Si spam ou non pertinent → ignorer
    if (analysis.category === 'spam' || !analysis.is_relevant) {
      console.log(`📧 Email de ${emailData.from} ignoré (${analysis.category})`);
      
      // ✅ Logger l'événement
      await supabase.from('email_logs').insert({
        action: 'ignored',
        details: { 
          from: emailData.from,
          subject: emailData.subject,
          reason: analysis.category,
          analysis: analysis 
        }
      });
      
      return { action: 'ignored', reason: analysis.category };
    }
    
    // 3. Si newsletter → gérer directement
    if (analysis.category === 'newsletter') {
      await handleNewsletter(emailData, analysis);
      return { action: 'newsletter_handled' };
    }
    
    // 4. Stocker dans la base (email pertinent)
    const { data: email, error } = await supabase
      .from('incoming_emails')
      .insert({
        from_email: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        received_at: new Date().toISOString(),
        category: analysis.category,
        priority: analysis.priority,
        is_relevant: true,
        assigned_agent: analysis.assigned_agent,
        status: 'pending',
        ai_analysis: analysis,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion:', error);
      return { action: 'error', error };
    }

    console.log(`✅ Email ${email.id} stocké et assigné à ${analysis.assigned_agent}`);
    
    // 5. Créer une tâche pour l'agent assigné
    await createAgentTask(email.id, analysis);

    return { 
      action: 'stored', 
      email_id: email.id,
      assigned_agent: analysis.assigned_agent 
    };
    
  } catch (error) {
    console.error('❌ Erreur processIncomingEmail:', error);
    return { action: 'error', error };
  }
}

// ✅ Gérer la newsletter
async function handleNewsletter(emailData: any, analysis: any) {
  try {
    // Vérifier si l'abonné existe déjà
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', emailData.from)
      .single();

    if (existing) {
      console.log(`📬 ${emailData.from} déjà abonné`);
      return;
    }

    // Ajouter à la newsletter
    await supabase
      .from('newsletter_subscribers')
      .insert({
        email: emailData.from,
        interests: analysis.interests || ['general'],
        source: 'email',
        is_active: true,
      });

    console.log(`📬 ${emailData.from} ajouté à la newsletter`);
    
  } catch (error) {
    console.error('❌ Erreur newsletter:', error);
  }
}

// ✅ Créer une tâche pour un agent
async function createAgentTask(emailId: string, analysis: any) {
  // Récupérer l'agent
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('name', analysis.assigned_agent)
    .single();

  if (!agent) {
    console.log(`⚠️ Agent ${analysis.assigned_agent} non trouvé`);
    return;
  }

  await supabase.from('agent_tasks').insert({
    agent_id: agent.id,
    email_id: emailId,
    task_type: 'analyze',
    input_data: { analysis },
    priority: analysis.priority === 'high' ? 1 : 2,
  });
}