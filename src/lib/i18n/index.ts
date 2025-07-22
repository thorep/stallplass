export type Language = 'no';

export interface TranslationKeys {
  // Navigation
  nav: {
    home: string;
    stables: string;
    messages: string;
    rentals: string;
    profile: string;
    login: string;
    register: string;
    logout: string;
    myStable: string;
    pricing: string;
    contact: string;
    support: string;
    about: string;
    privacy: string;
    terms: string;
    hello: string;
    newMessages: string;
    myProfile: string;
    getStarted: string;
  };
  
  // Common actions
  actions: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
    submit: string;
    search: string;
    filter: string;
    sort: string;
    reset: string;
    close: string;
    open: string;
    view: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    retry: string;
    confirm: string;
  };
  
  // Stable related
  stable: {
    title: string;
    description: string;
    location: string;
    price: string;
    boxes: string;
    amenities: string;
    contact: string;
    reviews: string;
    availability: string;
    owner: string;
    createStable: string;
    editStable: string;
    myStables: string;
    searchStables: string;
    noStablesFound: string;
    stableDetails: string;
    addImages: string;
    facilities: string;
  };
  
  // Box related
  box: {
    title: string;
    size: string;
    price: string;
    available: string;
    occupied: string;
    rent: string;
    details: string;
    amenities: string;
    images: string;
    addBox: string;
    editBox: string;
    deleteBox: string;
    boxNumber: string;
    dimensions: string;
  };
  
  // Messages/Chat
  messages: {
    title: string;
    newMessage: string;
    typeMessage: string;
    sendMessage: string;
    conversation: string;
    noMessages: string;
    startConversation: string;
    chatWith: string;
    online: string;
    offline: string;
    typing: string;
  };
  
  // Rentals
  rentals: {
    title: string;
    active: string;
    pending: string;
    completed: string;
    cancelled: string;
    startDate: string;
    endDate: string;
    monthlyPrice: string;
    totalPrice: string;
    renter: string;
    owner: string;
    status: string;
    createRental: string;
    confirmRental: string;
    cancelRental: string;
    extendRental: string;
  };
  
  // Reviews
  reviews: {
    title: string;
    rating: string;
    comment: string;
    writeReview: string;
    editReview: string;
    deleteReview: string;
    noReviews: string;
    averageRating: string;
    totalReviews: string;
    reviewFrom: string;
    reviewFor: string;
    helpful: string;
  };
  
  // Payments
  payments: {
    title: string;
    amount: string;
    status: string;
    paid: string;
    pending: string;
    failed: string;
    processing: string;
    paymentHistory: string;
    paymentMethod: string;
    vipps: string;
    invoice: string;
    receipt: string;
    dueDate: string;
  };
  
  // Forms and validation
  forms: {
    required: string;
    invalidEmail: string;
    passwordTooShort: string;
    passwordMismatch: string;
    invalidPhone: string;
    invalidUrl: string;
    maxLength: string;
    minLength: string;
    invalidFormat: string;
    fieldError: string;
  };
  
  // Error messages
  errors: {
    general: string;
    networkError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    loadingFailed: string;
    saveFailed: string;
    deleteFailed: string;
    uploadFailed: string;
    paymentFailed: string;
    connectionLost: string;
  };
  
  // Success messages
  success: {
    saved: string;
    created: string;
    updated: string;
    deleted: string;
    uploaded: string;
    paymentCompleted: string;
    messageSent: string;
    reviewSubmitted: string;
    rentalConfirmed: string;
  };
  
  // Time and dates
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    thisWeek: string;
    thisMonth: string;
    lastMonth: string;
    minute: string;
    minutes: string;
    hour: string;
    hours: string;
    day: string;
    days: string;
    week: string;
    weeks: string;
    month: string;
    months: string;
    year: string;
    years: string;
    ago: string;
  };
  
  // Admin
  admin: {
    title: string;
    dashboard: string;
    users: string;
    stables: string;
    boxes: string;
    payments: string;
    reviews: string;
    analytics: string;
    settings: string;
    moderateContent: string;
    banUser: string;
    approveStable: string;
    refundPayment: string;
  };
}

export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;