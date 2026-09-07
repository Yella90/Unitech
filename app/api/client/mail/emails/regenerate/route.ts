// app/api/client/mail/emails/regenerate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateClient } from '@/lib/api/auth';
import { harveyV2 } from '@/lib/agents/harvey-v2/HarveyV2';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await authenticateClient(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // 2. Récupérer l'ID de l'email
    const body = await req.json();
    const { emailId } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'ID de l\'email requis' },
        { status: 400 }
      );
    }

    // 3. Vérifier que l'email appartient au client
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('client_id', authResult.client.id)
      .single();

    if (emailError || !email) {
      return NextResponse.json(
        { error: 'Email non trouvé ou non autorisé' },
        { status: 404 }
      );
    }

    // 4. Supprimer la réponse existante et remettre en 'pending'
    const { error: updateError } = await supabase
      .from('emails')
      .update({
        status: 'pending',
        harvey_response: null,
        harvey_response_html: null,
        harvey_confidence: null,
        harvey_tone: null,
        harvey_actions: null,
        harvey_suggested_agent: null,
        processed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // 5. Nettoyer le cache de Harvey V2
    if (harveyV2['processedEmails']) {
      harveyV2['processedEmails'].delete(emailId);
    }

    // 6. Forcer le traitement
    const result = await harveyV2.processClientEmails(
      authResult.client.id,
      { limit: 10, syncNew: true }
    );

    // 7. Vérifier si l'email a été retraité
    const { data: updatedEmail } = await supabase
      .from('emails')
      .select('status, harvey_response, harvey_confidence')
      .eq('id', emailId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        email_id: emailId,
        status: updatedEmail?.status || 'pending',
        has_response: !!updatedEmail?.harvey_response,
        confidence: updatedEmail?.harvey_confidence || 0,
        processed: result.processed,
        errors: result.errors
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur régénération:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la régénération' },
      { status: 500 }
    );
  }
}