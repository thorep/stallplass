import '@testing-library/jest-dom'

// MSW setup can be added later when needed
// For now, focus on basic component testing

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }) {
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock Firebase Auth - will be set up per test
// jest.mock('@/lib/auth-context', () => ({
//   useAuth: () => ({
//     user: {
//       uid: 'test-user-id',
//       email: 'test@example.com',
//       displayName: 'Test User',
//       getIdToken: jest.fn().mockResolvedValue('mock-token'),
//     },
//     loading: false,
//     signIn: jest.fn(),
//     signUp: jest.fn(),
//     logout: jest.fn(),
//   }),
// }))

// Supabase client will be mocked per test

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
})

// Suppress console errors in tests (unless debugging)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('Error:') ||
       args[0].includes('Error updating base price:') ||
       args[0].includes('Database error'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})