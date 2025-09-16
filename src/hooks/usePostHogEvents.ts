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

    // Horse sale creation
    horseSaleCreated: (properties?: {
      horse_sale_id?: string;
      price?: number;
      breed_id?: string;
      discipline_id?: string;
      size?: string;
    }) => {
      captureEvent('horse_sale_created', properties);
    },

    // Horse buy creation
    horseBuyCreated: (properties?: {
      horse_buy_id?: string;
      price_min?: number;
      price_max?: number;
      age_min?: number;
      age_max?: number;
      breed_id?: string;
      discipline_id?: string;
    }) => {
      captureEvent('horse_buy_created', properties);
    },

    // Part-loan horse (forhest) creation
    partLoanHorseCreated: (properties?: { part_loan_horse_id?: string; county_id?: string; municipality_id?: string }) => {
      captureEvent('part_loan_horse_created', properties);
    },

    // Forum activity
    forumReplyPosted: (properties?: { thread_id?: string; category?: string; reply_length?: number }) => {
      captureEvent('forum_reply_posted', properties);
    },

    // Search interactions
    searchResultClicked: (properties: { result_type: 'stable' | 'box' | 'service' | 'forhest' | 'horse_sale' | 'horse_buy'; result_id: string; search_query?: string; position?: number }) => {
      captureEvent('search_result_clicked', properties);
    },

    // Search pagination interactions
    searchPaginationClicked: (properties: {
      action: 'next' | 'prev' | 'number';
      from_page: number;
      to_page: number;
      mode?: 'stables' | 'boxes' | 'services' | 'forhest' | 'horse_sales';
      horse_trade?: 'sell' | 'buy';
      page_size?: number;
      total_pages?: number;
      total_results?: number;
      sort_by?: string;
    }) => {
      captureEvent('search_pagination_clicked', properties);
    },

    // Update/edit events (saved)
    stableUpdated: (properties: { stable_id: string }) => {
      captureEvent('stable_updated', properties);
    },
    boxUpdated: (properties: { box_id: string }) => {
      captureEvent('box_updated', properties);
    },
    serviceUpdated: (properties: { service_id: string }) => {
      captureEvent('service_updated', properties);
    },
    horseSaleUpdated: (properties: { horse_sale_id: string }) => {
      captureEvent('horse_sale_updated', properties);
    },
    horseBuyUpdated: (properties: { horse_buy_id: string }) => {
      captureEvent('horse_buy_updated', properties);
    },
    partLoanHorseUpdated: (properties: { part_loan_horse_id: string }) => {
      captureEvent('part_loan_horse_updated', properties);
    },

    // Generic capture function for custom events
    custom: captureEvent,
  };

  return events;
};
