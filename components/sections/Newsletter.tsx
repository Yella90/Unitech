// components/public/sections/Newsletter.tsx (Version simple)
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setMessage('Veuillez entrer un email valide');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') {
          setMessage('Cet email est déjà abonné !');
          setStatus('error');
        } else {
          throw error;
        }
        return;
      }

      setMessage('✅ Merci pour votre inscription !');
      setStatus('success');
      setEmail('');
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);

    } catch (err) {
      console.error('Erreur:', err);
      setMessage('Une erreur est survenue. Veuillez réessayer.');
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section id="newsletter" className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] p-8 text-center text-white md:p-12">
        <h2 className="text-2xl font-bold md:text-3xl">📬 Suivez notre aventure</h2>
        <p className="mt-2 text-white/80">
          Soyez informé de l'avancement de nos projets.
          <br />
          <span className="text-sm">Pas encore de produits disponibles, mais bientôt !</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Entrez votre email"
            required
            className="w-full rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 sm:w-72"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-xl bg-[#F97316] px-6 py-3 font-semibold text-white transition hover:bg-[#ea580c] disabled:opacity-50"
          >
            {status === 'loading' ? '...' : "Je m'abonne"}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-300' : 'text-green-300'}`}>
            {message}
          </p>
        )}

        <p className="mt-4 text-xs text-white/60">
          🔒 Aucun spam, juste des mises à jour sur nos progrès.
        </p>
      </div>
    </section>
  );
}