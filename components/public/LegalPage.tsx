// components/public/LegalPage.tsx
// Mise en page des documents légaux (confidentialité, conditions, cookies).
import Link from 'next/link';

export const LEGAL_CONTACT = {
  email: 'doumbialayesoma@gmail.com',
  phone: '+223 90692363',
};

const DOCUMENTS = [
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/conditions-utilisation', label: "Conditions d'utilisation" },
  { href: '/cookies', label: 'Cookies' },
];

export default function LegalPage({
  title,
  updated,
  intro,
  current,
  children,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#F5F7FB] px-4 py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Documents légaux" className="mb-6 flex flex-wrap gap-2">
          {DOCUMENTS.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              aria-current={doc.href === current ? 'page' : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                doc.href === current
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-white text-[#1E3A8A] border border-slate-200 hover:border-[#1E3A8A]'
              }`}
            >
              {doc.label}
            </Link>
          ))}
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E3A8A] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">Dernière mise à jour : {updated}</p>
          <div className="mt-5 text-base leading-relaxed text-slate-700">{intro}</div>
        </header>

        <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-5 text-[15px] leading-relaxed text-slate-700 shadow-sm sm:p-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#1E3A8A] [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_p+p]:mt-3 [&_a]:font-medium [&_a]:text-[#1E3A8A] [&_a]:underline [&_table]:w-full [&_table]:text-left [&_table]:text-sm [&_th]:border-b [&_th]:border-slate-200 [&_th]:py-2 [&_th]:pr-3 [&_th]:font-semibold [&_td]:border-b [&_td]:border-slate-100 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top">
          {children}
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Une question sur ce document ? Écrivez-nous à{' '}
          <a href={`mailto:${LEGAL_CONTACT.email}`} className="font-medium text-[#1E3A8A] underline">
            {LEGAL_CONTACT.email}
          </a>{' '}
          ou appelez le {LEGAL_CONTACT.phone}.
        </p>
      </article>
    </div>
  );
}
