// Facebook Pixel tracking utilities

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
  }
}

export const fbq = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args)
  }
}

// Standard Facebook Pixel events
export const trackPageView = () => {
  fbq('track', 'PageView')
}

export const trackViewContent = (contentName?: string, contentCategory?: string, value?: number, currency?: string) => {
  const parameters: Record<string, unknown> = {}
  
  if (contentName) parameters.content_name = contentName
  if (contentCategory) parameters.content_category = contentCategory
  if (value) parameters.value = value
  if (currency) parameters.currency = currency
  
  fbq('track', 'ViewContent', parameters)
}

export const trackSearch = (searchString: string) => {
  fbq('track', 'Search', {
    search_string: searchString
  })
}

export const trackContact = () => {
  fbq('track', 'Contact')
}

export const trackCompleteRegistration = () => {
  fbq('track', 'CompleteRegistration')
}

export const trackInitiateCheckout = (value?: number, currency?: string, numItems?: number) => {
  const parameters: Record<string, unknown> = {}
  
  if (value) parameters.value = value
  if (currency) parameters.currency = currency
  if (numItems) parameters.num_items = numItems
  
  fbq('track', 'InitiateCheckout', parameters)
}

export const trackPurchase = (value: number, currency: string = 'NOK') => {
  fbq('track', 'Purchase', {
    value: value,
    currency: currency
  })
}

export const trackLead = (contentName?: string, value?: number, currency?: string) => {
  const parameters: Record<string, unknown> = {}
  
  if (contentName) parameters.content_name = contentName
  if (value) parameters.value = value
  if (currency) parameters.currency = currency
  
  fbq('track', 'Lead', parameters)
}

// Custom events for Stallplass
export const trackStableView = (stableId: string, stableName?: string) => {
  fbq('trackCustom', 'StableView', {
    stable_id: stableId,
    stable_name: stableName
  })
}

export const trackBoxView = (boxId: string, stableId: string, price?: number) => {
  fbq('trackCustom', 'BoxView', {
    box_id: boxId,
    stable_id: stableId,
    price: price
  })
}

export const trackServiceView = (serviceId: string, serviceType?: string, location?: string) => {
  fbq('trackCustom', 'ServiceView', {
    service_id: serviceId,
    service_type: serviceType,
    location: location
  })
}

export const trackListingCreated = (listingType: 'box' | 'service', location?: string) => {
  fbq('trackCustom', 'ListingCreated', {
    listing_type: listingType,
    location: location
  })
}

export const trackSearchPerformed = (searchType: 'box' | 'service' | 'stable', location?: string, filters?: object) => {
  fbq('trackCustom', 'SearchPerformed', {
    search_type: searchType,
    location: location,
    filters: filters
  })
}

export const trackContactInitiated = (listingType: 'box' | 'service', listingId: string) => {
  fbq('trackCustom', 'ContactInitiated', {
    listing_type: listingType,
    listing_id: listingId
  })
}