import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';
import { MapPin, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LocationsPage() {
  const locations = await repository.getLocationsAggregate();
  const stats = await repository.getDatabaseStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Header */}
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-5 h-0.5 bg-[#C8FF4D]" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Geographic Spread
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101114] tracking-tight">
            Location Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Aggregated municipal and regional problem trends without exposing individual identity or sensitive personal locations.
          </p>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="p-4 rounded-3xl bg-white border border-neutral-200 shadow-sm mb-10 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-700 leading-relaxed">
            <strong>Privacy Protection Guarantee:</strong> ARTIX aggregates telemetry at the city and district tier. Exact street addresses, coordinates, phone numbers, and emails are never collected or made accessible.
          </div>
        </div>

        {/* Aggregate Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#101114]">
              {stats.locationsCovered}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Cities & Municipalities</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#101114]">
              {stats.totalProblems}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Geolocated Reports</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#101114]">
              100%
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Anonymized Aggregation</div>
          </div>
        </div>

        {/* Cities Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#101114]">Top Reporting Cities</h3>
            <span className="text-xs text-neutral-500">{locations.length} regions active</span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            {locations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                No location data reported yet.
              </div>
            ) : (
              locations.map(loc => (
                <div key={loc.city} className="p-4 sm:p-5 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-neutral-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#101114]">{loc.city}</h4>
                      <p className="text-[11px] text-neutral-500">Top area: {loc.topCategory}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-full">
                      {loc.count} {loc.count === 1 ? 'report' : 'reports'}
                    </span>
                    <Link
                      href={`/explore?search=${encodeURIComponent(loc.city)}`}
                      className="text-[#101114] hover:text-emerald-700 font-semibold"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
