# Stallplass 🐎

A Norwegian platform for horse stable management and discovery, connecting stable owners with horse riders.

## 🌟 Features

- **Stable Listings**: Browse and search horse stables across Norway
- **Real-time Messaging**: Instant chat between stable owners and riders
- **Box Management**: Individual horse box listings with detailed information
- **Payment Integration**: Vipps payment processing for stable advertising
- **Two-way Reviews**: Rating system for both stable owners and riders
- **Admin Dashboard**: Complete management interface for stable owners
- **Mobile-First Design**: Responsive design optimized for all devices

## 🚀 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Firebase Auth (being migrated to Supabase Auth)
- **Payments**: Vipps API integration
- **State Management**: TanStack Query + Zustand
- **Testing**: Jest, React Testing Library, Playwright

## 🛠️ Development Setup

### Prerequisites

- Node.js 22.x
- Docker (for Supabase local development)
- Supabase CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stallplass
```

2. Install dependencies:
```bash
npm install
```

3. Start Supabase locally:
```bash
npm run db:start
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄️ Database Management

The project uses **Supabase** for database management with real-time capabilities.

### Local Development URLs

- **App**: http://localhost:3000
- **Supabase API**: http://127.0.0.1:54321
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Supabase Studio**: http://127.0.0.1:54323

### Database Commands

**Local Development:**
```bash
# Start Supabase stack
npm run db:start

# Stop Supabase stack
npm run db:stop

# Create new migration
npm run db:migrate <migration-name>

# Apply all migrations (resets local DB)
npm run db:reset

# Generate TypeScript types from local DB
npm run db:types
```

**Advanced Local Commands:**
```bash
# Apply only new migrations (without reset)
supabase migration up

# Check migration status
supabase migration list
```

## 🔄 Database Migrations - The Complete Guide

### 🏠 **LOCAL MIGRATIONS (Your Development Machine)**

**What it does:** Applies migrations to your local Docker database

**Step-by-step:**
```bash
# 1. Create new migration file
supabase migration new "your_feature_name"

# 2. Edit the SQL file that was created in supabase/migrations/
# Add your CREATE TABLE, ALTER TABLE, etc. commands

# 3. Apply to local database (WIPES and rebuilds entire local DB)
supabase db reset

# 4. Generate new TypeScript types
supabase gen types typescript --local > src/types/supabase.ts

# 5. Test your changes locally, then commit
git add . && git commit -m "Add your_feature_name migration"
```

**Key points:**
- ✅ `supabase db reset` ONLY affects your local Docker database
- ✅ Safe to run multiple times - completely rebuilds from scratch
- ✅ Applies ALL migrations in order
- ❌ Never touches production

---

### 🚀 **PRODUCTION MIGRATIONS (Live Database)**

**What it does:** Applies NEW migrations to your live Supabase database

**Prerequisites (one-time setup):**
```bash
# Link your local project to production (you've already done this!)
supabase link --project-ref your-project-ref
```

**Step-by-step:**
```bash
# 1. Push ONLY new migrations to production
supabase db push

# 2. Optional: Update types from production schema
supabase gen types typescript --project-ref your-project-ref > src/types/supabase.ts

# 3. Deploy your app
git push  # This triggers Vercel deployment
```

**Key points:**
- ✅ `supabase db push` ONLY applies new migrations
- ✅ Safe - never wipes existing data
- ✅ Compares local migrations with production state
- ❌ Cannot run `supabase db reset` on production

---

### 🎯 **Crystal Clear Command Reference**

| **Goal** | **Local Command** | **Production Command** |
|----------|------------------|----------------------|
| Apply migrations | `supabase db reset` | `supabase db push` |
| Generate types | `supabase gen types typescript --local` | `supabase gen types typescript --project-ref <ref>` |
| Check status | `supabase status` | `supabase migration list` |
| Create migration | `supabase migration new "name"` | (same - just a file) |

### ⚠️ **Critical Safety Rules**

- **NEVER** run `supabase db reset` on production (it's not even possible)
- **ALWAYS** test migrations locally with `supabase db reset` first
- **ALWAYS** run `supabase db push` before deploying your app
- **Migrations are separate** from app deployment

### **Quick Reference - Daily Commands:**

**Starting development:**
```bash
npm run db:start    # Start local Supabase
npm run dev         # Start Next.js app
```

**Adding a new feature with DB changes:**
```bash
npm run db:migrate "feature_name"  # Create migration
# Edit the .sql file in supabase/migrations/
npm run db:reset                   # Apply to local DB
npm run db:types                   # Update TypeScript types
# Test your feature, then commit to git
```

**Deploying to production:**
```bash
supabase db push    # Apply migrations to production
git push           # Deploy app to Vercel
```

## 📊 Logging System

The application uses **Pino** for structured logging with configurable levels.

### Log Levels (lowest to highest)

```bash
trace (10)  # Very detailed debugging
debug (20)  # Debugging information  
info (30)   # General information
warn (40)   # Warning messages
error (50)  # Error messages
fatal (60)  # Fatal errors
```

### Default Log Levels

- **Development**: `debug` level (shows debug, info, warn, error, fatal)
- **Production**: `info` level (shows info, warn, error, fatal)

### Adjusting Log Levels

**Temporary level change:**
```bash
# Show only warnings and errors
LOG_LEVEL=warn npm run dev

# Show everything including trace details
LOG_LEVEL=trace npm run dev

# Show only errors and fatal
LOG_LEVEL=error npm run dev

# Quiet development (errors only)
LOG_LEVEL=error npm run dev
```

**Persistent level change:**
```bash
# Set in your shell session
export LOG_LEVEL=info
npm run dev

# Or create .env.local file:
echo "LOG_LEVEL=warn" >> .env.local
```

### Log Output

- **Console**: Pretty-printed in development, JSON in production
- **File**: All logs written to `logs/app.log` with automatic rotation
- **Browser**: Client-side errors logged automatically

### Log Rotation

Log files automatically rotate to prevent excessive disk usage:

- **Size limit**: 10MB per file
- **Time rotation**: Daily
- **Retention**: Keep 7 days of logs  
- **Compression**: Old logs compressed with gzip
- **File pattern**: 
  ```
  logs/app.log           # Current log
  logs/app.log.1.gz      # Yesterday (compressed)  
  logs/app.log.2.gz      # 2 days ago (compressed)
  # ... up to 7 days
  ```

### Usage in Code

```typescript
import { logger } from '@/lib/logger';

// Structured logging with context
logger.info({ userId: 'abc123', action: 'create_stable' }, 'User created stable');
logger.error({ error, stableId: 'def456' }, 'Failed to save stable');
logger.debug({ requestData }, 'Processing request');
```

## 💰 Important: Stable Advertising Requirement

**⚠️ CRITICAL: Stables and their boxes will NOT appear in search results unless the stable has active advertising!**

For a stable's boxes to be visible in the public search on `/staller`:
1. The stable must have `advertising_active = true` in the database
2. The stable must have a valid `advertising_end_date` in the future
3. Only then will the stable's boxes appear in search results

This is a business requirement to ensure only paying customers' stables are promoted on the platform.

### Testing with Local Data

When creating test data locally:
```sql
-- Enable advertising for a stable (required for visibility)
UPDATE stables 
SET advertising_active = true,
    advertising_end_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = 'your-stable-id';
```

Or when creating stables programmatically, ensure you set:
```typescript
{
  advertising_active: true,
  advertising_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
}
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components (Atomic Design)
│   ├── atoms/          # Basic building blocks
│   ├── molecules/      # Simple combinations
│   └── organisms/      # Complex components
├── hooks/              # Custom React hooks
├── services/           # Business logic and API calls
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
└── __tests__/          # Unit and integration tests

supabase/
├── migrations/         # Database migrations
├── seed.sql           # Database seed data
└── config.toml        # Supabase configuration
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase (legacy)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Vipps Payment
VIPPS_CLIENT_ID=your_vipps_client_id
VIPPS_CLIENT_SECRET=your_vipps_client_secret
VIPPS_SUBSCRIPTION_KEY=your_vipps_subscription_key
```

## ⚡ Real-time Features

The application includes real-time chat functionality powered by Supabase:

- Messages appear instantly without page refresh
- Real-time conversation status updates
- Automatic message read receipts
- Optimistic UI updates for smooth user experience

## 🏗️ Architecture Highlights

- **Real-time Subscriptions**: Supabase subscriptions for chat functionality
- **Type Safety**: Full TypeScript integration with auto-generated database types
- **Row Level Security**: Database-level security policies
- **Atomic Design**: Component organization following atomic design principles
- **Error Boundaries**: Comprehensive error handling and user feedback

## 📱 PWA Support

The application is Progressive Web App ready with:
- Service worker for offline functionality
- App manifest for installable experience
- Optimized for mobile performance

## 🚀 Deployment

The application can be deployed on Vercel or any Node.js hosting platform:

1. Set up environment variables in your hosting platform
2. Connect your Supabase database
3. Deploy using your preferred method

For Vercel deployment:
```bash
vercel deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🐛 Issues

For bug reports and feature requests, please use the project's issue tracker.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local