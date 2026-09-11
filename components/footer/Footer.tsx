'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#101114] text-white border-t border-neutral-800/80 pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-800/60">
          {/* Left: ARTIX Logo & Quick Nav Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7">
                <path d="M18 4L4 32H12L18 19L24 32H32L18 4Z" fill="#C8FF4D" />
                <path d="M18 13L11 28H15L18 21L21 28H25L18 13Z" fill="#101114" />
              </svg>
              <span className="text-lg font-bold tracking-widest text-white">ARTIX</span>
            </Link>

            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

            <nav className="flex flex-wrap items-center gap-5 text-xs text-neutral-400">
              <Link href="/" className="hover:text-[#C8FF4D] transition-colors">Home</Link>
              <Link href="/about" className="hover:text-[#C8FF4D] transition-colors">About</Link>
              <Link href="/how-it-works" className="hover:text-[#C8FF4D] transition-colors">How It Works</Link>
              <Link href="/explore" className="hover:text-[#C8FF4D] transition-colors">Explore</Link>
              <Link href="/live" className="hover:text-[#C8FF4D] transition-colors">Live Stream</Link>
              <Link href="/landscape" className="hover:text-[#C8FF4D] transition-colors">3D Landscape</Link>
              <Link href="/#submit" className="hover:text-[#C8FF4D] transition-colors">Share a Problem</Link>
            </nav>
          </div>

          {/* Center: Social Icons */}
          <div className="flex items-center space-x-3 text-neutral-400">
            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:text-[#C8FF4D] hover:border-neutral-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </a>

            {/* X (Twitter) */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X / Twitter"
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:text-[#C8FF4D] hover:border-neutral-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:text-[#C8FF4D] hover:border-neutral-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center hover:text-[#C8FF4D] hover:border-neutral-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>

          {/* Right: CodeArtix & Founder Attribution */}
          <div className="text-center md:text-right text-xs text-neutral-400 space-y-0.5">
            <p>
              An <span className="text-[#C8FF4D] font-medium">ARTIX</span> Product by{' '}
              <span className="text-white font-medium">CodeArtix</span>
            </p>
            <p className="text-neutral-500">
              Founded by <span className="text-neutral-300">Santhoshkumar</span>
            </p>
          </div>
        </div>

        {/* Lower copyright & philosophy */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-3">
          <p>© {new Date().getFullYear()} CodeArtix. All rights reserved.</p>
          <p className="italic text-neutral-400 font-serif">
            &ldquo;Don&apos;t Start With an Idea. Start With a Problem.&rdquo;
          </p>
          <div className="flex items-center space-x-4 text-neutral-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/admin" className="hover:text-[#C8FF4D] transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
