"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import NextError from "next/error";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    // Capture the global error with PostHog
    if (posthog) {
      posthog.captureException(error, {
        source: 'global-error-boundary',
        digest: error.digest,
      });
    }
  }, [error, posthog]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}