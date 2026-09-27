'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

  const navLinks = [
    { name: 'Home', href: '/', id: 'hero' },
    { name: 'About', href: '/#about', id: 'about' },
    { name: 'How It Works', href: '/#how-it-works', id: 'how-it-works' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08131A]/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-neutral-800/80'
          : 'bg-[#08131A] border-b border-neutral-800/40'
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
                fill="#C8FF3D"
              />
              <path
                d="M18 13L11 28H15L18 21L21 28H25L18 13Z"
                fill="#08131A"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-widest text-white">
            ARTIX
          </span>
        </Link>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={(e) => link.id !== 'hero' && scrollToSection(e, link.id)}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors relative py-1"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right: Primary Call to Action */}
        <div className="hidden sm:flex items-center">
          <Link
            href="/#submit-problem"
            onClick={(e) => scrollToSection(e, 'submit-problem')}
            className="group px-5 py-2.5 bg-[#C8FF3D] hover:bg-[#DFFF73] text-[#08131A] text-xs font-bold rounded-full transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[#C8FF3D]/20 flex items-center gap-2"
          >
            <span>Share a Problem</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/#submit-problem"
            onClick={(e) => scrollToSection(e, 'submit-problem')}
            className="px-3.5 py-1.5 bg-[#C8FF3D] text-[#08131A] text-xs font-bold rounded-full flex items-center gap-1.5"
          >
            <span>Share</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-300 hover:text-white focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#08131A] border-b border-neutral-800 px-4 pt-3 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.id !== 'hero') scrollToSection(e, link.id);
                  setMobileMenuOpen(false);
                }}
                className="text-base font-semibold text-neutral-200 hover:text-[#C8FF3D] transition-colors py-1"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-2">
            <Link
              href="/#submit-problem"
              onClick={(e) => {
                scrollToSection(e, 'submit-problem');
                setMobileMenuOpen(false);
              }}
              className="w-full justify-center px-5 py-3 bg-[#C8FF3D] text-[#08131A] text-sm font-bold rounded-full flex items-center gap-2"
            >
              <span>Share a Problem</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
