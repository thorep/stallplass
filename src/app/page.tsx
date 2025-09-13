"use client";

import { useRouter } from "next/navigation";
import { useFeatureFlagEnabled, usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const flagEnabled = useFeatureFlagEnabled("landingpage");

  useEffect(() => {
    if (flagEnabled === undefined) return;
    const variant = posthog.getFeatureFlag("landingpage");
    console.log("VARIANT: ", variant);
    if (variant === "home") router.push("/hjem");
    else router.push("/sok");
  }, [flagEnabled, posthog, router]);

  // Safety: if flags fail to load, fall back after a short timeout
  useEffect(() => {
    if (flagEnabled !== undefined) return;
    const t = setTimeout(() => {
      router.push("/sok");
    }, 1500);
    return () => clearTimeout(t);
  }, [flagEnabled, router]);

  return null;
}
