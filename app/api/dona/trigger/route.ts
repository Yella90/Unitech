// app/api/dona/trigger/route.ts
import { NextResponse } from 'next/server';
import { dona } from '@/lib/agents/dona/processor';
import { requireTriggerAccess } from '@/lib/api/trigger-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes maximum

export async function POST(request: Request) {
    try {
        // 🔒 Sécurité : cron (CRON_SECRET) ou admin autorisé
        const denied = await requireTriggerAccess(request, 'ai.approve');
        if (denied) {
            console.error('❌ DONA: Accès non autorisé');
            return denied;
        }

        console.log('🔄 DONA: Début du traitement manuel...');
        console.log(`📅 ${new Date().toISOString()}`);

        // ✅ Initialiser DONA
        await dona.init();

        // ✅ Traiter les emails en attente avec processBatch
        const result = await dona.processBatch({ 
            maxEmails: 50 
        });
        
        console.log(`✅ DONA: ${result.processed} traités, ${result.ignored} ignorés, ${result.errors.length} erreurs`);

        // ✅ Récupérer le statut
        const status = dona.getStatus();

        return NextResponse.json({
            success: true,
            processed: result.processed,
            ignored: result.ignored,
            errors: result.errors,
            total: result.total,
            duration: result.duration,
            status: {
                initialized: status.initialized,
                processedEmails: status.processedEmails,
                keywordConfigs: status.keywordConfigs,
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('❌ DONA Trigger error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal error' },
            { status: 500 }
        );
    }
}

// ✅ Support GET pour les tests
export async function GET(request: Request) {
    return POST(request);
}