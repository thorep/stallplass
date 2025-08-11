"use client";

import { theme } from "@/lib/mui-theme";
import { AuthProvider } from "@/lib/supabase-auth-context";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuth } from "@/lib/supabase-auth-context";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 3,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      person_profiles: "always", // or 'always' to create profiles for anonymous users as well
      defaults: "2025-05-24",
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <PostHogUserIdentifier>
              {children}
              {/* <ReactQueryDevtools initialIsOpen={false} /> */}
            </PostHogUserIdentifier>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}

// PostHog user identifier component
function PostHogUserIdentifier({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && posthog) {
      // Only identify if we have a user and PostHog is ready
      posthog.identify(user.id, {
        email: user.email,
        email_verified: user.email_confirmed_at != null,
        created_at: user.created_at,
      });
    } else if (!loading && !user && posthog) {
      // Reset PostHog when user logs out
      posthog.reset();
    }
  }, [posthog, user, loading]);

  return <>{children}</>;
}
