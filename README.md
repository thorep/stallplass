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

```bash
# Start Supabase stack
npm run db:start

# Stop Supabase stack
npm run db:stop

# Reset database and apply migrations
npm run db:reset

# Create new migration
npm run db:migrate <migration-name>

# Generate TypeScript types
npm run db:types
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
