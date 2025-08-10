// Utility functions for Umami analytics tracking

declare global {
  interface Window {
    umami: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
      identify: (userData: Record<string, unknown>) => void;
    };
  }
}

/**
 * Track an event with Umami analytics
 * @param eventName - Name of the event (max 50 characters)
 * @param eventData - Optional data to track with the event
 */
export const trackEvent = (eventName: string, eventData?: Record<string, unknown>) => {
  // Only track in browser environment and when umami is loaded
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami.track(eventName, eventData);
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  }
};

/**
 * Set a distinct ID for the current user
 * @param userId - Unique identifier for the user
 * @param userData - Optional additional user data
 */
export const identifyUser = (userId: string, userData?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.umami) {
    try {
      const data = {
        id: userId,
        ...userData
      };
      window.umami.identify(data);
    } catch (error) {
      console.debug('User identification failed:', error);
    }
  }
};

// Predefined events for consistency
export const AnalyticsEvents = {
  // Authentication
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Search & Discovery
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  STABLE_CLICKED: 'stable_clicked',
  SERVICE_CLICKED: 'service_clicked',
  
  // Stable Management
  STABLE_CREATED: 'stable_created',
  BOX_CREATED: 'box_created',
  STABLE_PUBLISHED: 'stable_published',
  STABLE_EDITED: 'stable_edited',
  
  // Communication
  MESSAGE_SENT: 'message_sent',
  CONVERSATION_STARTED: 'conversation_started',
  
  // Horse Management
  HORSE_CREATED: 'horse_created',
  HORSE_LOG_CREATED: 'horse_log_created',
  
  // Forum Activity
  FORUM_POST_CREATED: 'forum_post_created',
  FORUM_REPLY_CREATED: 'forum_reply_created',
  
  // Business Critical
  CONTACT_STABLE: 'contact_stable',
  ADVERTISING_VIEWED: 'advertising_viewed',
} as const;

// Helper functions for common tracking scenarios
export const trackSearch = (query: string, filters?: Record<string, unknown>, resultCount?: number) => {
  trackEvent(AnalyticsEvents.SEARCH_PERFORMED, {
    query: query.substring(0, 100), // Limit query length
    has_filters: Boolean(filters && Object.keys(filters).length > 0),
    result_count: resultCount,
  });
};

export const trackStableClick = (stableId: string, source: 'search' | 'featured' | 'direct' = 'direct') => {
  trackEvent(AnalyticsEvents.STABLE_CLICKED, {
    stable_id: stableId,
    source,
  });
};

export const trackServiceClick = (serviceId: string, serviceType: string, source: 'search' | 'featured' | 'direct' = 'direct') => {
  trackEvent(AnalyticsEvents.SERVICE_CLICKED, {
    service_id: serviceId,
    service_type: serviceType,
    source,
  });
};

export const trackUserAuth = (action: 'signup' | 'login' | 'logout', method?: 'email' | 'google') => {
  const eventMap = {
    signup: AnalyticsEvents.USER_SIGNUP,
    login: AnalyticsEvents.USER_LOGIN,
    logout: AnalyticsEvents.USER_LOGOUT,
  };
  
  trackEvent(eventMap[action], method ? { method } : undefined);
};

export const trackConversation = (action: 'started' | 'message_sent', recipientType: 'stable_owner' | 'service_provider' | 'user') => {
  const eventName = action === 'started' ? AnalyticsEvents.CONVERSATION_STARTED : AnalyticsEvents.MESSAGE_SENT;
  trackEvent(eventName, {
    recipient_type: recipientType,
  });
};

// Helper to get user segment for better analytics insights
export const getUserSegment = (user: { isAdmin?: boolean; hasStables?: boolean; hasServices?: boolean } | null) => {
  if (!user) return 'anonymous';
  
  // You can expand this logic based on user properties
  // For example: premium users, stable owners, service providers, etc.
  if (user.isAdmin) return 'admin';
  if (user.hasStables) return 'stable_owner';
  if (user.hasServices) return 'service_provider';
  
  return 'rider'; // Default segment for regular users
};

// Track page views with enhanced context
export const trackPageView = (pageName: string, userSegment?: string) => {
  trackEvent('page_view', {
    page: pageName,
    segment: userSegment || 'anonymous',
    timestamp: new Date().toISOString(),
  });
};

// Track conversion from anonymous to registered user
export const trackUserConversion = (anonymousId: string, userId: string) => {
  trackEvent('user_conversion', {
    from_id: anonymousId,
    to_id: `user_${userId}`,
    converted_at: new Date().toISOString(),
  });
  
  // Clear the anonymous ID from localStorage after conversion
  if (typeof window !== 'undefined') {
    localStorage.removeItem('umami_anonymous_id');
  }
};

// Helper to check if user is returning visitor
export const isReturningVisitor = () => {
  if (typeof window === 'undefined') return false;
  
  const visitKey = 'umami_returning_visitor';
  const hasVisited = localStorage.getItem(visitKey);
  
  if (!hasVisited) {
    localStorage.setItem(visitKey, 'true');
    return false;
  }
  
  return true;
};