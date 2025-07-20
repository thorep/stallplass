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

## 🔄 Database Migration Workflow

### **Local Development Process:**

1. **Create a new migration:**
   ```bash
   npm run db:migrate "add_new_feature"
   # or directly: supabase migration new "add_new_feature"
   ```

2. **Edit the migration file:**
   - Find the new file in `supabase/migrations/`
   - Add your SQL changes

3. **Apply to local database:**
   ```bash
   npm run db:reset
   # This resets local DB and applies ALL migrations
   ```

4. **Test your changes locally**

5. **Generate updated TypeScript types:**
   ```bash
   npm run db:types
   ```

6. **Commit everything to git:**
   ```bash
   git add .
   git commit -m "Add new feature migration"
   ```

### **Production Deployment Process:**

**Prerequisites:** Project must be linked to Supabase (one-time setup):
```bash
supabase link --project-ref your-project-ref
```

**Deploy migrations to production:**
```bash
# Apply new migrations to production (safe - only applies new ones)
supabase db push

# Optional: Generate types from production schema
supabase gen types typescript --project-ref your-project-ref > src/types/supabase.ts
```

**Then deploy your app:**
```bash
# Deploy to Vercel (or your platform)
vercel deploy
```

### **Important Migration Notes:**

- **Local**: `supabase db reset` wipes entire local database and reapplies ALL migrations
- **Production**: `supabase db push` safely applies only NEW migrations
- **Never** run `supabase db reset` against production
- **Always** test migrations locally before pushing to production
- **Migrations are separate** from app deployment - apply them first

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
