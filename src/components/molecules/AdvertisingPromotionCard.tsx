"use client";

import { ArrowUpRightIcon, MegaphoneIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React from "react";

/**
 * AdvertisingPromotionCard - A horizontal promotional card component
 * 
 * This component displays an eye-catching advertisement card that promotes
 * advertising services on Stallplass. It's designed to be randomly placed
 * among search results to attract potential advertisers. Matches the layout
 * of BoxListingCard for consistent appearance.
 * 
 * Features:
 * - Horizontal layout matching BoxListingCard design
 * - Professional emerald/green color scheme matching brand
 * - Hover effects with smooth transitions
 * - Responsive design (mobile-first)
 * - Clear "advertisement" labeling for transparency
 * - Links to /annonsering page
 * 
 * Usage:
 * ```tsx
 * import AdvertisingPromotionCard from "@/components/molecules/AdvertisingPromotionCard";
 * 
 * // Basic usage
 * <AdvertisingPromotionCard />
 * 
 * // With additional classes
 * <AdvertisingPromotionCard className="col-span-1" />
 * 
 * // Integration in search results grid
 * const searchResults = [...boxes];
 * const randomPosition = Math.floor(Math.random() * 40) + 1;
 * searchResults.splice(randomPosition, 0, { type: 'advertisement' });
 * 
 * {searchResults.map((item, index) => 
 *   item.type === 'advertisement' ? (
 *     <AdvertisingPromotionCard key={`ad-${index}`} />
 *   ) : (
 *     <BoxListingCard key={item.id} box={item} />
 *   )
 * )}
 * ```
 * 
 * @param className - Additional CSS classes to apply
 */

interface AdvertisingPromotionCardProps {
  className?: string;
}

function AdvertisingPromotionCard({ className = "" }: AdvertisingPromotionCardProps) {
  return (
    <Link
      href="/annonsering"
      className={`block bg-white rounded-lg shadow-sm border-2 border-dashed border-emerald-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-emerald-300 cursor-pointer group ${className}`}
    >
      {/* Mobile-first: Stack layout matching BoxListingCard */}
      <div className="flex flex-col md:flex-row">
        {/* Left side - Visual/Icon area */}
        <div className="relative md:w-1/3">
          <div className="relative h-48 md:h-full w-full bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 group-hover:from-emerald-100 group-hover:to-green-100 transition-colors flex items-center justify-center">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-12 h-12 border-2 border-emerald-400 rounded-full"></div>
              <div className="absolute bottom-6 left-6 w-6 h-6 border border-green-400 rounded-full"></div>
              <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-emerald-400 rounded-full"></div>
              <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
            
            {/* Icon */}
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:bg-emerald-600 transition-colors">
                <MegaphoneIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Advertisement label */}
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-200 text-emerald-800">
              Annonse
            </span>
          </div>
        </div>

        {/* Right side - Content area */}
        <div className="flex-1 p-4 md:p-6">
          <div className="h-full flex flex-col justify-center">
            {/* Main text */}
            <h3 className="text-xl md:text-2xl font-bold text-emerald-900 mb-3 leading-tight">
              Ønsker du å annonsere her?
            </h3>

            {/* Subtitle */}
            <p className="text-gray-700 mb-4 leading-relaxed">
              Nå tusenvis av hestefolk som leter etter staller og tjenester. Få synlighet for din virksomhet.
            </p>

            {/* Call to action */}
            <div className="flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700 transition-colors">
              <span>Les mer om annonsering</span>
              <ArrowUpRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Export with React.memo for performance optimization
export default React.memo(AdvertisingPromotionCard);