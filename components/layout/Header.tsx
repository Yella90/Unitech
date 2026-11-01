// components/layout/Header.tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Bouton FR / EN : affiche la langue vers laquelle on bascule
function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, t, setLocale } = useLanguage();
  const next = locale === 'fr' ? 'en' : 'fr';

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t.header.switchLanguage}
      title={t.header.switchLanguage}
      className={`rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition ${className}`}
    >
      {next}
    </button>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-white font-black text-lg">
            U
          </div>
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">UNITECH</p>
            <p className="text-sm font-bold text-[#1E3A8A]">{t.header.tagline}</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/projects">
            <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-[#1E3A8A]">
              {t.header.projects}
            </Button>
          </Link>
          <Link href="/training">
  <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-[#1E3A8A]">
    {t.header.training}
  </Button>
</Link>
          <Link href="/contact">
            <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-[#1E3A8A]">
              {t.header.contact}
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-[#1E3A8A]">
              {t.header.services}
            </Button>
          </Link>

          <Button className="bg-[#F97316] hover:bg-[#ea580c] text-white" asChild>
            <a href="#newsletter">{t.header.follow}</a>
          </Button>

          <LanguageSwitch className="ml-1" />
        </nav>

        {/* Mobile : langue + bouton menu */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitch />
          <button
            className="p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={t.header.menu}
          >
            {isOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-white p-4 flex flex-col gap-2">
          <Link href="/projects" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-[#1E3A8A]">
              {t.header.projects}
            </Button>
          </Link>
          <Link href="/contact" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-[#1E3A8A]">
              {t.header.contact}
            </Button>
          </Link>
          <Button className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white" asChild>
            <a href="#newsletter" onClick={() => setIsOpen(false)}>{t.header.follow}</a>
          </Button>
        </nav>
      )}
    </header>
  );
}
