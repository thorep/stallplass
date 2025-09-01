"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface NewsBannerData {
  tittel: string;
  innhold: string;
}

export default function NewsBanner() {
  const posthog = usePostHog();
  const [bannerData, setBannerData] = useState<NewsBannerData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!posthog) return;

    // Get feature flag payload for banner
    const flagPayload = posthog.getFeatureFlagPayload("banner");

    if (flagPayload && typeof flagPayload === "object" && !Array.isArray(flagPayload)) {
      const data = flagPayload as unknown as NewsBannerData;
      const dismissed = localStorage.getItem("dismissed-news-banner");
      if (dismissed) {
        const dismissedData = JSON.parse(dismissed);
        if (JSON.stringify(dismissedData) === JSON.stringify(data)) {
          setIsVisible(false);
          return;
        }
      }
      setBannerData(data);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }

    // Listen for feature flag changes
    const handleFeatureFlags = () => {
      const updatedPayload = posthog.getFeatureFlagPayload("banner");
      if (updatedPayload && typeof updatedPayload === "object" && !Array.isArray(updatedPayload)) {
        const data = updatedPayload as unknown as NewsBannerData;
        const dismissed = localStorage.getItem("dismissed-news-banner");
        if (dismissed) {
          const dismissedData = JSON.parse(dismissed);
          if (JSON.stringify(dismissedData) === JSON.stringify(data)) {
            setIsVisible(false);
            return;
          }
        }
        setBannerData(data);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    posthog.onFeatureFlags(handleFeatureFlags);

    return () => {
      // Cleanup listener
      posthog.onFeatureFlags(() => {});
    };
  }, [posthog]);

  const handleClose = () => {
    if (bannerData) {
      localStorage.setItem("dismissed-news-banner", JSON.stringify(bannerData));
    }
    setIsVisible(false);
  };

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
