// MSW setup temporarily disabled due to polyfill issues
// Will be re-enabled once all polyfills are properly configured

// import { setupServer } from 'msw/node'
// import { handlers } from '../mocks/handlers'

// // Setup MSW server for testing
// export const server = setupServer(...handlers)

// // Establish API mocking before all tests
// beforeAll(() => {
//   server.listen({
//     onUnhandledRequest: 'warn',
//   })
// })

// // Clean up after each test
// afterEach(() => {
//   server.resetHandlers()
// })

// // Clean up after all tests are done
// afterAll(() => {
//   server.close()
// })