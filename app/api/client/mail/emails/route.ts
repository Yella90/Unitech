// app/api/client/mail/emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateClient } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await authenticateClient(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const clientId = authResult.client.id;
    console.log(`📧 Récupération des emails pour client: ${clientId}`);

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 2. ✅ Requête avec les bonnes colonnes
    let query = supabase
      .from('emails')
      .select(`
        id,
        from_email,
        from_name,
        to_email,
        subject,
        body,
        body_html,
        status,
        category,
        priority,
        received_at,
        created_at,
        updated_at,
        is_read,
        is_replied,
        harvey_response,
        harvey_response_html,
        harvey_response_json,
        harvey_tone,
        harvey_confidence,
        harvey_actions,
        harvey_requires_review,
        harvey_suggested_agent,
        processed_at,
        replied_at,
        mail_account_id,
        client_id,
        attachments
      `, { count: 'exact' })
      .eq('client_id', clientId)
      .order('received_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 3. Exécuter la requête
    const { data: emails, error, count } = await query;

    if (error) {
      console.error('❌ Erreur récupération emails:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          data: [],
          count: 0
        },
        { status: 500 }
      );
    }

    console.log(`✅ ${emails?.length || 0} emails récupérés sur ${count || 0} total`);

    // 4. Transformer les données pour correspondre au type attendu
    const formattedEmails = emails?.map((email: any) => ({
      id: email.id,
      mail_account_id: email.mail_account_id,
      client_id: email.client_id,
      from_email: email.from_email || '',
      from_name: email.from_name || '',
      to_email: Array.isArray(email.to_email) ? email.to_email : (email.to_email ? [email.to_email] : []),
      subject: email.subject || '',
      body: email.body || '',
      body_html: email.body_html || '',
      status: email.status || 'pending',
      category: email.category || '',
      priority: email.priority || 'normal',
      received_at: email.received_at || email.created_at,
      is_read: email.is_read || false,
      is_replied: email.is_replied || false,
      harvey_response: email.harvey_response || '',
      harvey_response_html: email.harvey_response_html || '',
      harvey_response_json: email.harvey_response_json || null,
      harvey_tone: email.harvey_tone || '',
      harvey_confidence: email.harvey_confidence || 0,
      harvey_actions: email.harvey_actions || [],
      harvey_requires_review: email.harvey_requires_review || false,
      harvey_suggested_agent: email.harvey_suggested_agent || '',
      processed_at: email.processed_at || null,
      replied_at: email.replied_at || null,
      created_at: email.created_at,
      updated_at: email.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedEmails,
      count: formattedEmails.length,
      total: count || 0
    });

  } catch (error: any) {
    console.error('❌ Erreur API emails:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}