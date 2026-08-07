// components/layout/Header.tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

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
            <p className="text-sm font-bold text-[#1E3A8A]">Solutions technologiques</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/projects">
            <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-[#1E3A8A]">
              Projets
            </Button>
          </Link>
          <Link href="/training">
  <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-[#1E3A8A]">
    Formation
  </Button>
</Link>
          <Link href="/contact">
            <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-[#1E3A8A]">
              Contact
            </Button>
          </Link>
          <Button className="bg-[#F97316] hover:bg-[#ea580c] text-white" asChild>
            <a href="#newsletter">Suivre</a>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-white p-4 flex flex-col gap-2">
          <Link href="/projects" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-[#1E3A8A]">
              Projets
            </Button>
          </Link>
          <Link href="/contact" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-[#1E3A8A]">
              Contact
            </Button>
          </Link>
          <Button className="w-full bg-[#F97316] hover:bg-[#ea580c] text-white" asChild>
            <a href="#newsletter" onClick={() => setIsOpen(false)}>Suivre</a>
          </Button>
        </nav>
      )}
    </header>
  );
}