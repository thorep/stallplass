#!/bin/bash

# Script to run E2E tests with proper setup
# This ensures the local database is running and tests run in the correct order

echo "🚀 Starting E2E test run..."

# Check if local Supabase is running
echo "🔍 Checking if local Supabase is running..."
if ! curl -f http://localhost:54322/health >/dev/null 2>&1; then
    echo "❌ Local Supabase is not running!"
    echo "Please start it with: npm run db:start"
    exit 1
fi

echo "✅ Local Supabase is running"

# Check if dev server is running
echo "🔍 Checking if dev server is running..."
if ! curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "❌ Dev server is not running!"
    echo "Please start it with: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"

# Run the tests
echo "🧪 Running E2E tests..."
npm run test:e2e

echo "🏁 Test run completed"