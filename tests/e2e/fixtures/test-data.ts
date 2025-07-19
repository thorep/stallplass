// Test data fixtures for E2E tests

export const testUsers = {
  regularUser: {
    email: 'test.user@example.com',
    password: 'TestPassword123!',
    displayName: 'Test User',
    phone: '+47 12345678',
  },
  stableOwner: {
    email: 'stable.owner@example.com',
    password: 'StablePass123!',
    displayName: 'Stable Owner',
    phone: '+47 87654321',
  },
  admin: {
    email: 'admin@stallplass.no',
    password: 'AdminPass123!',
    displayName: 'Admin User',
    phone: '+47 11111111',
  },
};

export const testStables = {
  basicStable: {
    name: 'Test Ridestall',
    description: 'En flott stall for testing',
    address: {
      street: 'Testveien 123',
      postalCode: '0123',
      city: 'Oslo',
      coordinates: {
        lat: 59.9139,
        lng: 10.7522,
      },
    },
    contactInfo: {
      phone: '+47 12345678',
      email: 'kontakt@teststall.no',
      website: 'https://teststall.no',
    },
    facilities: {
      totalBoxes: 20,
      availableBoxes: 5,
      indoorArena: true,
      outdoorArena: true,
      paddocks: 10,
      washingFacilities: true,
      feedingService: true,
    },
    pricing: {
      monthlyPrice: 4500,
      hasDiscount: true,
      discountPercentage: 10,
      discountMonths: 6,
    },
  },
  premiumStable: {
    name: 'Premium Hestesenter',
    description: 'Eksklusivt hestesenter med alle fasiliteter',
    address: {
      street: 'Prestegårdsveien 45',
      postalCode: '1234',
      city: 'Bergen',
      coordinates: {
        lat: 60.3913,
        lng: 5.3221,
      },
    },
    contactInfo: {
      phone: '+47 98765432',
      email: 'info@premiumhester.no',
      website: 'https://premiumhester.no',
    },
    facilities: {
      totalBoxes: 50,
      availableBoxes: 12,
      indoorArena: true,
      outdoorArena: true,
      paddocks: 25,
      washingFacilities: true,
      feedingService: true,
      veterinaryService: true,
      solarium: true,
    },
    pricing: {
      monthlyPrice: 7500,
      hasDiscount: true,
      discountPercentage: 15,
      discountMonths: 12,
    },
  },
};

export const testBoxes = {
  standardBox: {
    number: 'B-001',
    size: 'standard',
    monthlyPrice: 4500,
    amenities: ['Strøm', 'Vann', 'Daglig rengjøring'],
    description: 'Standard boks med alle grunnleggende fasiliteter',
    available: true,
  },
  premiumBox: {
    number: 'P-001',
    size: 'large',
    monthlyPrice: 6500,
    amenities: ['Strøm', 'Vann', 'Daglig rengjøring', 'Automatisk fôring', 'Ekstra stor'],
    description: 'Premium boks med ekstra plass og automatisk fôring',
    available: true,
  },
};

export const testSearchFilters = {
  location: {
    city: 'Oslo',
    maxDistance: 50,
  },
  price: {
    min: 3000,
    max: 8000,
  },
  amenities: ['Ridehall', 'Utebane', 'Vaskefasiliteter'],
  facilities: ['Beite', 'Fôrservice'],
};

export const testPayment = {
  validCard: {
    number: '4111111111111111',
    expiry: '12/25',
    cvc: '123',
    name: 'Test User',
  },
  amount: 4500,
  currency: 'NOK',
};

export const testReview = {
  rating: 5,
  title: 'Fantastisk stall!',
  comment: 'Veldig fornøyd med denne stallen. Bra fasiliteter og hyggelig personale.',
  wouldRecommend: true,
};

export const testMessage = {
  subject: 'Spørsmål om ledig boks',
  content: 'Hei! Jeg lurer på om dere har ledig plass for min hest fra neste måned?',
};

// Helper functions for test data
export const generateRandomEmail = () => {
  const timestamp = Date.now();
  return `test.user.${timestamp}@example.com`;
};

export const generateRandomPhone = () => {
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `+47 ${number}`;
};

export const generateUniqueStableName = () => {
  const timestamp = Date.now();
  return `Test Stall ${timestamp}`;
};