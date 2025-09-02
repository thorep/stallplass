import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

export interface NewsBannerData {
  tittel: string;
  innhold: string;
}

export function useNewsBanner() {
  const posthog = usePostHog();
  const [bannerData, setBannerData] = useState<NewsBannerData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!posthog) return;

    const updateBanner = (payload: unknown) => {
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const data = payload as unknown as NewsBannerData;
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

    // Initial check
    updateBanner(posthog.getFeatureFlagPayload("banner"));

    // Listen for changes
    const handleFeatureFlags = () => {
      updateBanner(posthog.getFeatureFlagPayload("banner"));
    };

    posthog.onFeatureFlags(handleFeatureFlags);

    return () => {
      posthog.onFeatureFlags(() => {});
    };
  }, [posthog]);

  const handleClose = () => {
    if (bannerData) {
      localStorage.setItem("dismissed-news-banner", JSON.stringify(bannerData));
    }
    setIsVisible(false);
    posthog.capture("news_banner_dismissed", {
      banner_title: bannerData?.tittel,
      banner_content: bannerData?.innhold,
    });
  };

  return { bannerData, isVisible, handleClose };
}