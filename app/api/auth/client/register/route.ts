// app/api/auth/client/register/route.ts (Version avec logs détaillés)
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// Logger personnalisé
const logger = {
    info: (message: string, data?: any) => {
        console.log(`📝 ${message}`, data ? JSON.stringify(data, null, 2) : '');
    },
    error: (message: string, error?: any) => {
        console.error(`❌ ${message}`, error ? JSON.stringify(error, null, 2) : '');
    },
    success: (message: string, data?: any) => {
        console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
};

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    
    try {
        const body = await req.json();
        const { 
            email, 
            password, 
            first_name, 
            last_name, 
            company_name, 
            phone 
        } = body;

        logger.info('📥 Réception requête inscription', { email, first_name, company_name });

        // ✅ Validation des champs
        if (!email || !password) {
            logger.error('❌ Champs manquants', { email: !!email, password: !!password });
            return NextResponse.json(
                { error: 'Email et mot de passe requis' },
                { status: 400 }
            );
        }

        // Validation du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger.error('❌ Format email invalide', { email });
            return NextResponse.json(
                { error: 'Format d\'email invalide' },
                { status: 400 }
            );
        }

        // Validation du mot de passe
        if (password.length < 8) {
            logger.error('❌ Mot de passe trop court', { length: password.length });
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins 8 caractères' },
                { status: 400 }
            );
        }

        // ✅ Vérifier si l'email existe déjà
        logger.info('🔍 Vérification email existant...', { email });
        const { data: existingClient, error: checkError } = await supabase
            .from('clients')
            .select('email')
            .eq('email', email)
            .single();

        if (existingClient) {
            logger.error('❌ Email déjà utilisé', { email });
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 409 }
            );
        }

        if (checkError && checkError.code !== 'PGRST116') {
            logger.error('❌ Erreur vérification email', checkError);
            return NextResponse.json(
                { error: 'Erreur lors de la vérification' },
                { status: 500 }
            );
        }

        // ✅ Hasher le mot de passe
        logger.info('🔐 Hachage du mot de passe...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // ✅ Générer un token de vérification
        const verificationToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        logger.info('🔑 Token de vérification généré', { expiresAt: expiresAt.toISOString() });

        // ✅ Créer le client
        logger.info('📝 Création du client...', { email, first_name, company_name });
        const { data: client, error: createError } = await supabase
            .from('clients')
            .insert({
                email,
                password_hash: passwordHash,
                first_name: first_name || null,
                last_name: last_name || null,
                company_name: company_name || null,
                phone: phone || null,
                subscription_plan: 'free',
                credits_balance: 50,
                is_active: true,
                email_verified: false,
                verification_token: verificationToken,
                created_at: new Date().toISOString()
            })
            .select('id, email, first_name, last_name, company_name, subscription_plan, credits_balance, email_verified')
            .single();

        if (createError) {
            logger.error('❌ Erreur création client', createError);
            
            if (createError.code === '23505') {
                return NextResponse.json(
                    { error: 'Cet email est déjà utilisé' },
                    { status: 409 }
                );
            }
            
            return NextResponse.json(
                { error: 'Erreur lors de la création du compte' },
                { status: 500 }
            );
        }

        logger.success('✅ Client créé', { id: client.id, email: client.email });

        // ✅ Enregistrer le token de vérification
        logger.info('📝 Enregistrement du token de vérification...');
        const { error: verifyError } = await supabase
            .from('email_verifications')
            .insert({
                client_id: client.id,
                email: client.email,
                token: verificationToken,
                expires_at: expiresAt.toISOString()
            });

        if (verifyError) {
            logger.error('❌ Erreur sauvegarde token de vérification', verifyError);
        } else {
            logger.success('✅ Token de vérification enregistré');
        }

        // ✅ Ajouter l'email à la queue pour envoi
        try {
            logger.info('📧 Ajout de l\'email à la queue...');
            const { data: queueResult, error: queueError } = await supabase
                .rpc('add_verification_email', {
                    p_client_id: client.id,
                    p_email: client.email,
                    p_first_name: client.first_name || 'Client',
                    p_token: verificationToken
                });

            if (queueError) {
                logger.error('❌ Erreur ajout à la queue email', queueError);
            } else {
                logger.success('✅ Email ajouté à la queue', { queueId: queueResult });
            }
        } catch (queueError) {
            logger.error('❌ Erreur lors de l\'ajout à la queue', queueError);
        }

        // ✅ Créer une session automatique
        const sessionToken = randomBytes(32).toString('hex');
        const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        logger.info('📝 Création de la session...');
        const { error: sessionError } = await supabase
            .from('client_sessions')
            .insert({
                client_id: client.id,
                token: sessionToken,
                expires_at: sessionExpiresAt.toISOString(),
                ip_address: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
                user_agent: req.headers.get('user-agent') || 'unknown',
                is_active: true
            });

        if (sessionError) {
            logger.error('❌ Erreur création session', sessionError);
        } else {
            logger.success('✅ Session créée');
        }

        // ✅ Préparer la réponse
        const duration = Date.now() - startTime;
        logger.info(`⏱️ Inscription terminée en ${duration}ms`);

        const response = NextResponse.json({
            success: true,
            message: 'Compte créé avec succès. Un email de vérification vous a été envoyé.',
            user: {
                id: client.id,
                email: client.email,
                first_name: client.first_name,
                last_name: client.last_name,
                company_name: client.company_name,
                subscription_plan: client.subscription_plan,
                credits_balance: client.credits_balance,
                email_verified: client.email_verified
            }
        });

        // ✅ Définir le cookie de session
        response.cookies.set('client_session_token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });

        return response;

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`❌ Erreur inscription (${duration}ms)`, error);
        
        return NextResponse.json(
            { error: 'Une erreur est survenue lors de l\'inscription' },
            { status: 500 }
        );
    }
}