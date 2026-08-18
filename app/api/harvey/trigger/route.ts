// app/api/harvey/trigger/route.ts
import { NextResponse } from 'next/server';
import { harvey } from '@/lib/agents/harvey/harvey';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes maximum

export async function POST(request: Request) {
    try {
        // 🔒 Sécurité
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET;
        
        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            console.error('❌ HARVEY: Accès non autorisé');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔄 HARVEY: Début du traitement manuel...');
        console.log(`📅 ${new Date().toISOString()}`);

        // ✅ Initialiser HARVEY
        await harvey.init();

        // ✅ Traiter les emails
        let emailResult = { processed: 0, errors: 0 };
        try {
            emailResult = await harvey.processPendingEmails(10);
        } catch (emailError: any) {
            console.error('❌ HARVEY: Erreur processPendingEmails:', emailError);
            emailResult = { processed: 0, errors: 1 };
        }

        // ✅ Traiter les contacts
        let contactResult = { processed: 0, errors: 0 };
        try {
            contactResult = await harvey.processPendingContacts(10);
        } catch (contactError: any) {
            console.error('❌ HARVEY: Erreur processPendingContacts:', contactError);
            contactResult = { processed: 0, errors: 1 };
        }

        // ✅ Récupérer le statut avec sécurité
        let status = { initialized: false, processedEmails: 0, processedContacts: 0, knowledgeBase: 0, templates: 0 };
        try {
            status = harvey.getStatus();
        } catch (statusError) {
            console.warn('⚠️ HARVEY: Erreur récupération statut:', statusError);
        }

        console.log(`✅ HARVEY: ${emailResult.processed || 0} emails, ${contactResult.processed || 0} contacts traités`);

        return NextResponse.json({
            success: true,
            emails: {
                processed: emailResult.processed || 0,
                errors: emailResult.errors || 0,
            },
            contacts: {
                processed: contactResult.processed || 0,
                errors: contactResult.errors || 0,
            },
            status: {
                initialized: status.initialized || false,
                processedEmails: status.processedEmails || 0,
                processedContacts: status.processedContacts || 0,
                knowledgeBase: status.knowledgeBase || 0,
                templates: status.templates || 0,
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('❌ HARVEY Trigger error:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error.message || 'Internal error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    return POST(request);
}