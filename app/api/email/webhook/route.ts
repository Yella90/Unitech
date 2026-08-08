// app/api/email/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // ✅ Récupérer les données du webhook
    const events = await request.json();
    
    // ✅ Vérifier que c'est un tableau d'événements
    if (!Array.isArray(events)) {
      console.warn('⚠️ Les données ne sont pas un tableau:', events);
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    console.log(`📊 ${events.length} événements reçus`);

    // ✅ Traiter chaque événement
    for (const event of events) {
      await processEvent(event);
    }

    // ✅ Répondre à SendGrid (200 = OK)
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    // ✅ Toujours retourner 200 pour éviter que SendGrid renvoie
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

// ✅ Traiter un événement
async function processEvent(event: any) {
  const { 
    email, 
    event: eventType, 
    timestamp, 
    sg_message_id,
    category,
    url,
    ip,
    useragent,
    reason,
    status,
    bounce_type
  } = event;

  console.log(`📧 ${eventType} - ${email}`);

  try {
    // ✅ Stocker dans la base de données
    const { error } = await supabase
      .from('email_logs')
      .insert({
        action: eventType,
        details: {
          email,
          sg_message_id,
          timestamp: new Date(timestamp * 1000).toISOString(),
          category,
          url,
          ip,
          useragent,
          reason,
          status,
          bounce_type,
        },
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Erreur insertion:', error);
    }

    // ✅ Actions spécifiques selon l'événement
    switch (eventType) {
      case 'bounce':
        await handleBounce(email, event);
        break;
      case 'unsubscribe':
        await handleUnsubscribe(email);
        break;
      case 'open':
        await handleOpen(email, event);
        break;
      case 'click':
        await handleClick(email, event);
        break;
      case 'dropped':
        await handleDropped(email, event);
        break;
    }

  } catch (error) {
    console.error(`❌ Erreur traitement événement ${eventType}:`, error);
  }
}

// ✅ Gérer les rebonds
async function handleBounce(email: string, event: any) {
  console.log(`⚠️ Email rebondi: ${email} - ${event.reason}`);
  
  // Mettre à jour le statut dans newsletter_subscribers si présent
  await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false })
    .eq('email', email);
}

// ✅ Gérer les désabonnements
async function handleUnsubscribe(email: string) {
  console.log(`📬 Désabonnement: ${email}`);
  
  await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false })
    .eq('email', email);
}

// ✅ Gérer les ouvertures
async function handleOpen(email: string, event: any) {
  // Mettre à jour les statistiques d'ouverture
  console.log(`👁️ Ouverture: ${email} - ${new Date(event.timestamp * 1000).toISOString()}`);
}

// ✅ Gérer les clics
async function handleClick(email: string, event: any) {
  console.log(`🖱️ Clic: ${email} - ${event.url}`);
}

// ✅ Gérer les emails droppés
async function handleDropped(email: string, event: any) {
  console.log(`❌ Email droppé: ${email} - ${event.reason}`);
  
  if (event.reason === 'Spam' || event.reason === 'Spam Content') {
    await supabase
      .from('newsletter_subscribers')
      .update({ is_active: false })
      .eq('email', email);
  }
}