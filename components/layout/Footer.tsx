// components/layout/Footer.tsx
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone } from "lucide-react";
import ManageCookiesButton from "@/components/public/ManageCookiesButton";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Entreprise */}
          <div>
            <p className="text-sm font-bold text-[#1E3A8A]">UNITECH</p>
            <p className="mt-1 text-xs text-slate-500">Solutions technologiques innovantes</p>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Contact</p>
            <div className="mt-2 space-y-1.5 text-xs text-slate-500">
              <a href="mailto:doumbialayesoma@gmail.com" className="flex items-center gap-2 hover:text-[#1E3A8A] transition">
                <Mail className="h-3.5 w-3.5" />
                doumbialayesoma@gmail.com
              </a>
              <a href="tel:+22390692363" className="flex items-center gap-2 hover:text-[#1E3A8A] transition">
                <Phone className="h-3.5 w-3.5" />
                +223 90692363
              </a>
            </div>
          </div>

          {/* Liens */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Liens</p>
            <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-500">
              <Link href="/services" className="hover:text-[#1E3A8A] transition">Services</Link>
              <Link href="/training" className="hover:text-[#1E3A8A] transition">Formations</Link>
              <Link href="/projects" className="hover:text-[#1E3A8A] transition">Projets</Link>
              <Link href="/contact" className="hover:text-[#1E3A8A] transition">Contact</Link>
            </div>
          </div>

          {/* Informations légales */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Informations légales</p>
            <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-500">
              <Link href="/confidentialite" className="hover:text-[#1E3A8A] transition">Politique de confidentialité</Link>
              <Link href="/conditions-utilisation" className="hover:text-[#1E3A8A] transition">Conditions d&apos;utilisation</Link>
              <Link href="/cookies" className="hover:text-[#1E3A8A] transition">Politique de cookies</Link>
              <ManageCookiesButton variant="link" />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} UNITECH. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
