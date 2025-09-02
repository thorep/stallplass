"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useNewsBanner } from "@/hooks/useNewsBanner";

export default function NewsBanner() {
  const { bannerData, isVisible, handleClose } = useNewsBanner();

  if (!isVisible || !bannerData) {
    return null;
  }

  return (
    <div
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 relative w-full"
      role="region"
      aria-label="Oppdatering"
      data-cy="site-banner"
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm md:text-base text-white line-clamp-2 md:line-clamp-none"
            data-cy="site-banner-content"
          >
            <strong className="font-semibold" data-cy="site-banner-title">
              {bannerData.tittel}:
            </strong>{" "}
            {bannerData.innhold}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="ml-4 shrink-0 hover:bg-white/20 focus:ring-2 focus:ring-white/50"
          aria-label="Lukk banner"
          data-cy="site-banner-close"
        >
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
