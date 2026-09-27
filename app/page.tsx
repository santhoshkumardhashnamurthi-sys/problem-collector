import React from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import { HeroSection } from '@/components/hero/HeroSection';
import { CategoriesSection } from '@/components/categories/CategoriesSection';
import { WhyItMattersSection } from '@/components/impact/WhyItMattersSection';
import { AboutSection } from '@/components/about/AboutSection';
import { HowItWorksSection } from '@/components/how-it-works/HowItWorksSection';
import { Footer } from '@/components/footer/Footer';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4E8] text-[#08131A] selection:bg-[#C8FF3D] selection:text-[#08131A]">
      {/* Top Sticky Minimalist Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with 3D ARTIX Visual & Problem Submission Form */}
        <HeroSection />

        {/* Problems Worth Solving / Informational Categories */}
        <CategoriesSection />

        {/* Dark Impact Section: Real People. Real Problems. Real Impact. */}
        <WhyItMattersSection />

        {/* About Section: Why ARTIX? */}
        <AboutSection />

        {/* How It Works: 3 Steps */}
        <HowItWorksSection />
      </main>

      {/* Dark Footer */}
      <Footer />
    </div>
  );
}
