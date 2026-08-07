// components/public/layout/Footer.tsx
import { Separator } from "@/components/ui/separator";
import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope, FaPhone } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <p className="text-sm font-bold text-[#1E3A8A]">UNITECH</p>
            <p className="text-xs text-slate-500">Solutions technologiques innovantes</p>
            <div className="mt-3 flex gap-3">
              <a href="#" className="text-slate-400 hover:text-[#1E3A8A] transition" aria-label="LinkedIn">
                <FaLinkedin className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-[#1E3A8A] transition" aria-label="GitHub">
                <FaGithub className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-[#1E3A8A] transition" aria-label="Twitter">
                <FaTwitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Contact</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <FaEnvelope className="h-3.5 w-3.5" />
                doumbialayesoma@gmail.com
              </p>
              <p className="flex items-center gap-2">
                <FaPhone className="h-3.5 w-3.5" />
                +223 90692363
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-sm font-semibold text-slate-700">Liens</p>
            <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
              <a href="/projects" className="hover:text-[#1E3A8A] transition">Projets</a>
              <a href="/training" className="hover:text-[#1E3A8A] transition">Formation</a>
              <a href="/contact" className="hover:text-[#1E3A8A] transition">Contact</a>
              <a href="#newsletter" className="hover:text-[#1E3A8A] transition">Newsletter</a>
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