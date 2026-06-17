'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiMenu, FiX, FiZap } from 'react-icons/fi';
import WalletButton from '@/components/wallet/WalletButton';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/create', label: 'Create Job' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-white">
            <FiZap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Stellar<span className="text-zinc-400">Gig</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WalletButton />
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-zinc-800 px-4 py-4 md:hidden animate-slide-up">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
}
