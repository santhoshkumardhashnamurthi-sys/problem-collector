import React from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import { HeroSection } from '@/components/hero/HeroSection';
import { CategoriesSection } from '@/components/categories/CategoriesSection';
import { WhyItMattersSection } from '@/components/impact/WhyItMattersSection';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch real database metrics & categories dynamically
  const [categories, stats] = await Promise.all([
    repository.getCategories(),
    repository.getDatabaseStats(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      {/* Top Dark Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* Hero Section matching exact reference */}
        <HeroSection />

        {/* Problems We're Collecting Section */}
        <CategoriesSection categories={categories} stats={stats} />

        {/* Dark Impact Section */}
        <WhyItMattersSection />
      </main>

      {/* Dark Footer */}
      <Footer />
    </div>
  );
}
