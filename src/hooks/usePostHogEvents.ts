'use client';

import { usePostHog } from 'posthog-js/react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export const usePostHogEvents = () => {
  const posthog = usePostHog();
  const { user } = useSupabaseUser();

  const captureEvent = (eventName: string, properties?: EventProperties) => {
    if (posthog) {
      const eventProps = {
        ...properties,
        timestamp: new Date().toISOString(),
        // Only include user data if user is logged in
        ...(user && {
          user_id: user.id,
          user_email: user.email,
        }),
      };
      
      posthog.capture(eventName, eventProps);
    }
  };

  // Specific event functions
  const events = {
    // User registration
    userSignedUp: (properties?: { method?: string; source?: string }) => {
      captureEvent('user_signed_up', properties);
    },

    // Stable creation
    stableCreated: (properties?: { stable_id?: string; location?: string }) => {
      captureEvent('stable_created', properties);
    },

    // Box (stallplass) creation
    boxCreated: (properties?: { box_id?: string; stable_id?: string; price?: number }) => {
      captureEvent('box_created', properties);
    },

    // Service creation
    serviceCreated: (properties?: { service_id?: string; service_type?: string; location?: string }) => {
      captureEvent('service_created', properties);
    },

    // Forum activity
    forumReplyPosted: (properties?: { thread_id?: string; category?: string; reply_length?: number }) => {
      captureEvent('forum_reply_posted', properties);
    },

    // Search interactions
    searchResultClicked: (properties: { result_type: 'stable' | 'box' | 'service' | 'forhest'; result_id: string; search_query?: string; position?: number }) => {
      captureEvent('search_result_clicked', properties);
    },

    // Generic capture function for custom events
    custom: captureEvent,
  };

  return events;
};