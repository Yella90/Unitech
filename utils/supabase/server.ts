// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.error('Erreur lors de la définition des cookies:', error);
          }
        },
      },
    }
  );
}

// ✅ FONCTION MANQUANTE - Récupérer la session admin
export async function getAdminSession() {
  const supabase = await createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  // Récupérer le rôle de l'utilisateur
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userError || !user) {
    return null;
  }

  // Vérifier que l'utilisateur a un rôle admin
  if (!['admin', 'super_admin'].includes(user.role)) {
    return null;
  }

  // Retourner la session avec les infos utilisateur
  return {
    ...session,
    users: {
      role: user.role,
    },
  };
}