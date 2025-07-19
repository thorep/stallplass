// Polyfills for Jest + MSW compatibility in Node.js environment

import { fetch, Headers, Request, Response } from 'cross-fetch'
import { TextEncoder, TextDecoder } from 'util'

// Add fetch polyfills to global scope
global.fetch = fetch
global.Headers = Headers
global.Request = Request  
global.Response = Response

// Add Response.json for Next.js Response class
if (typeof Response.json === 'undefined') {
  Response.json = function(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  }
}

// Add text encoding polyfills
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock URL and URLSearchParams if needed
if (typeof global.URL === 'undefined') {
  global.URL = URL
}

if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = URLSearchParams
}

// Mock ReadableStream for Node.js
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web')
  global.ReadableStream = ReadableStream
}

// Set up Firebase environment variables for tests
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:test'
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'G-TEST'