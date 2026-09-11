'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, X, ArrowUpRight } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Explore', href: '/explore' },
    { name: 'Live Stream', href: '/live' },
    { name: 'Insights', href: '/insights' },
    { name: '3D Landscape', href: '/landscape' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#101114]/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-[#101114]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: ARTIX Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 flex items-center justify-center">
            {/* Custom ARTIX Lambda 'A' Logo SVG */}
            <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8 transition-transform group-hover:scale-105">
              <path
                d="M18 4L4 32H12L18 19L24 32H32L18 4Z"
                fill="#C8FF4D"
              />
              <path
                d="M18 13L11 28H15L18 21L21 28H25L18 13Z"
                fill="#101114"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-widest text-white">
            ARTIX
          </span>
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.slice(0, 3).map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors relative py-1 ${
                  isActive ? 'text-[#C8FF4D]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C8FF4D] rounded-full" />
                )}
              </Link>
            );
          })}
          {/* Quick Dropdown / Direct link to explore */}
          <Link
            href="/explore"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-200"
          >
            Explore
          </Link>
          <Link
            href="/insights"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-200"
          >
            Insights
          </Link>
        </nav>

        {/* Right: Search + CTA */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Search Trigger */}
          {searchOpen ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/explore?search=${encodeURIComponent(searchQuery)}`);
                }
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search real problems..."
                autoFocus
                onBlur={() => !searchQuery && setSearchOpen(false)}
                className="w-48 lg:w-64 px-3 py-1.5 text-xs bg-neutral-800 text-white rounded-full border border-neutral-700 focus:outline-none focus:border-[#C8FF4D] transition-all"
              />
              <button type="submit" className="absolute right-2.5 text-neutral-400 hover:text-white">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-[#C8FF4D] hover:border-neutral-700 transition-colors"
              aria-label="Search problems"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Share a Problem CTA Pill Button */}
          <Link
            href="/#submit"
            className="inline-flex items-center gap-1.5 bg-[#C8FF4D] hover:bg-[#bbf03f] text-[#101114] text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-[#C8FF4D]/25"
          >
            Share a Problem
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <Link
            href="/#submit"
            className="bg-[#C8FF4D] text-[#101114] text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            Share
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#101114] border-b border-neutral-800 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-sm font-medium py-2 ${
                pathname === link.href ? 'text-[#C8FF4D]' : 'text-neutral-300 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-neutral-800">
            <Link
              href="/#submit"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#C8FF4D] text-[#101114] font-semibold py-2.5 rounded-full text-sm"
            >
              Share a Problem →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
