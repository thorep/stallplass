# Forum Implementation Guide for Stallplass

## Implementation Progress

### Phase 1: Database Setup
- [ ] Add forum schema to Prisma
- [ ] Run database migration
- [ ] Generate Prisma client
- [ ] Test database connection

### Phase 2: Core API Routes
- [ ] Categories API endpoints
- [ ] Threads API endpoints
- [ ] Posts API endpoints
- [ ] Basic validation and error handling

### Phase 3: Basic Frontend Pages
- [ ] Forum home page (/forum)
- [ ] Category view (/forum/[category])
- [ ] Thread view (/forum/[category]/[thread])
- [ ] Create thread page (/forum/ny-trad)

### Phase 4: Essential Components
- [ ] ForumLayout wrapper
- [ ] CategoryCard component
- [ ] ThreadList component
- [ ] PostCard component
- [ ] PostEditor component

### Phase 5: Enhanced Features
- [ ] User reactions system
- [ ] Thread subscriptions
- [ ] Rich text editor
- [ ] Image uploads
- [ ] Search functionality
- [ ] Tag system

### Phase 6: Moderation & Admin
- [ ] Report system
- [ ] Moderator tools
- [ ] Admin dashboard
- [ ] User role management

## Overview

This document outlines the implementation of a professional forum feature for Stallplass, fully integrated with the existing Next.js application architecture. The forum will leverage the current tech stack including Supabase Auth, PostgreSQL with Prisma, and MUI components.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Project Structure](#project-structure)
3. [Implementation Phases](#implementation-phases)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Security & Moderation](#security--moderation)
7. [Code Examples](#code-examples)

## Database Schema

Add the following models to `/prisma/schema.prisma`:

```prisma
// Forum Categories
model forum_categories {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  name        String
  slug        String   @unique
  description String?
  icon        String?  // MUI icon name
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  threads     forum_threads[]
  moderators  forum_moderators[]
}

// Forum Threads
model forum_threads {
  id           String   @id @default(dbgenerated("gen_random_uuid()"))
  title        String
  slug         String
  content      String   @db.Text
  authorId     String
  categoryId   String
  viewCount    Int      @default(0)
  isPinned     Boolean  @default(false)
  isLocked     Boolean  @default(false)
  isResolved   Boolean  @default(false)
  lastActivityAt DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  author       profiles @relation(fields: [authorId], references: [id])
  category     forum_categories @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  posts        forum_posts[]
  subscriptions forum_subscriptions[]
  tags         forum_thread_tags[]
  
  @@index([categoryId])
  @@index([authorId])
  @@index([lastActivityAt])
}

// Forum Posts (Replies)
model forum_posts {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  content    String   @db.Text
  authorId   String
  threadId   String
  parentId   String?  // For nested replies
  isEdited   Boolean  @default(false)
  editedAt   DateTime?
  isDeleted  Boolean  @default(false)
  deletedAt  DateTime?
  deletedBy  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  author     profiles @relation(fields: [authorId], references: [id])
  thread     forum_threads @relation(fields: [threadId], references: [id], onDelete: Cascade)
  parent     forum_posts? @relation("PostReplies", fields: [parentId], references: [id])
  replies    forum_posts[] @relation("PostReplies")
  reactions  forum_reactions[]
  reports    forum_reports[]
  
  @@index([threadId])
  @@index([authorId])
}

// Reactions (Likes, Helpful, etc.)
model forum_reactions {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  postId    String
  userId    String
  type      ReactionType
  createdAt DateTime @default(now())
  
  post      forum_posts @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      profiles @relation(fields: [userId], references: [id])
  
  @@unique([postId, userId, type])
  @@index([postId])
}

// Thread Subscriptions
model forum_subscriptions {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  threadId  String
  userId    String
  createdAt DateTime @default(now())
  
  thread    forum_threads @relation(fields: [threadId], references: [id], onDelete: Cascade)
  user      profiles @relation(fields: [userId], references: [id])
  
  @@unique([threadId, userId])
}

// Tags for Threads
model forum_tags {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  
  threads   forum_thread_tags[]
}

model forum_thread_tags {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  threadId  String
  tagId     String
  
  thread    forum_threads @relation(fields: [threadId], references: [id], onDelete: Cascade)
  tag       forum_tags @relation(fields: [tagId], references: [id])
  
  @@unique([threadId, tagId])
}

// Moderators
model forum_moderators {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  userId     String
  categoryId String?  // null = global moderator
  createdAt  DateTime @default(now())
  
  user       profiles @relation(fields: [userId], references: [id])
  category   forum_categories? @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([userId, categoryId])
}

// Content Reports
model forum_reports {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  postId      String
  reporterId  String
  reason      ReportReason
  description String?
  status      ReportStatus @default(PENDING)
  resolvedBy  String?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  
  post        forum_posts @relation(fields: [postId], references: [id], onDelete: Cascade)
  reporter    profiles @relation("ReportedBy", fields: [reporterId], references: [id])
  resolver    profiles? @relation("ResolvedBy", fields: [resolvedBy], references: [id])
  
  @@index([status])
}

// User Forum Stats (extend profiles)
model forum_user_stats {
  id          String   @id @default(dbgenerated("gen_random_uuid()"))
  userId      String   @unique
  postCount   Int      @default(0)
  threadCount Int      @default(0)
  reputation  Int      @default(0)
  helpfulCount Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        profiles @relation(fields: [userId], references: [id])
}

// Enums
enum ReactionType {
  LIKE
  HELPFUL
  THANKS
  AGREE
  DISAGREE
}

enum ReportReason {
  SPAM
  INAPPROPRIATE
  HARASSMENT
  OFF_TOPIC
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}
```

## Project Structure

```
src/
├── app/
│   ├── forum/                          # Forum pages
│   │   ├── page.tsx                    # Forum home
│   │   ├── [category]/
│   │   │   ├── page.tsx               # Category view
│   │   │   └── [thread]/
│   │   │       └── page.tsx           # Thread view
│   │   ├── ny-trad/
│   │   │   └── page.tsx               # Create thread
│   │   └── sok/
│   │       └── page.tsx               # Forum search
│   │
│   └── api/
│       └── forum/                      # Forum API routes
│           ├── categories/
│           │   └── route.ts
│           ├── threads/
│           │   ├── route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       ├── posts/
│           │       │   └── route.ts
│           │       └── subscribe/
│           │           └── route.ts
│           ├── posts/
│           │   ├── route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       └── reactions/
│           │           └── route.ts
│           ├── search/
│           │   └── route.ts
│           └── moderation/
│               ├── reports/
│               │   └── route.ts
│               └── actions/
│                   └── route.ts
│
├── components/
│   └── forum/                          # Forum components
│       ├── ForumLayout.tsx
│       ├── CategoryCard.tsx
│       ├── ThreadList.tsx
│       ├── ThreadCard.tsx
│       ├── PostEditor.tsx
│       ├── PostCard.tsx
│       ├── ReactionButtons.tsx
│       ├── UserBadge.tsx
│       ├── ForumSearch.tsx
│       └── ModerationTools.tsx
│
├── hooks/
│   └── forum/                          # Forum hooks
│       ├── useForumCategories.ts
│       ├── useThreads.ts
│       ├── useThread.ts
│       ├── usePosts.ts
│       ├── useCreateThread.ts
│       ├── useCreatePost.ts
│       ├── useReactions.ts
│       └── useForumSearch.ts
│
├── services/
│   └── forum/                          # Forum services
│       ├── forum-service.ts
│       ├── thread-service.ts
│       ├── post-service.ts
│       ├── moderation-service.ts
│       └── notification-service.ts
│
└── types/
    └── forum.ts                        # Forum types
```

## Implementation Phases

### Phase 1: Core Forum Structure (Week 1)

#### Tasks:
1. **Database Setup**
   - Add forum models to Prisma schema
   - Generate Prisma client
   - Create database migration

2. **Basic API Routes**
   - Categories CRUD operations
   - Thread creation and listing
   - Post creation and retrieval

3. **Essential Pages**
   - Forum home page with category listing
   - Category view with thread list
   - Thread view with posts
   - Create new thread page

4. **Core Components**
   - ForumLayout wrapper
   - CategoryCard for category display
   - ThreadList with pagination
   - PostCard for displaying posts

### Phase 2: Enhanced User Features (Week 2)

#### Tasks:
1. **User Interactions**
   - Post reactions (Like, Helpful, etc.)
   - Thread subscriptions
   - Edit/delete own posts
   - User reputation system

2. **Content Features**
   - Rich text editor with Markdown support
   - Image uploads in posts
   - Quote reply functionality
   - @mentions for users

3. **Discovery**
   - Forum search functionality
   - Tag system for threads
   - Trending threads
   - User post history

### Phase 3: Moderation & Administration (Week 3)

#### Tasks:
1. **Moderation Tools**
   - Report post functionality
   - Moderator dashboard
   - Pin/lock threads
   - Move threads between categories
   - Bulk moderation actions

2. **Admin Features**
   - Category management interface
   - Forum statistics dashboard
   - User role management
   - Forum settings page

3. **Content Management**
   - Soft delete for posts
   - Edit history tracking
   - Spam detection rules
   - Word filter configuration

## API Endpoints

### Categories
```typescript
GET    /api/forum/categories              // List all active categories
POST   /api/forum/categories              // Create category (admin)
PUT    /api/forum/categories/:id          // Update category (admin)
DELETE /api/forum/categories/:id          // Delete category (admin)
```

### Threads
```typescript
GET    /api/forum/threads                 // List threads (with filters)
POST   /api/forum/threads                 // Create new thread
GET    /api/forum/threads/:id             // Get thread details
PUT    /api/forum/threads/:id             // Update thread
DELETE /api/forum/threads/:id             // Delete thread
POST   /api/forum/threads/:id/subscribe   // Subscribe to thread
DELETE /api/forum/threads/:id/subscribe   // Unsubscribe from thread
```

### Posts
```typescript
GET    /api/forum/threads/:id/posts       // List posts in thread
POST   /api/forum/threads/:id/posts       // Create post in thread
GET    /api/forum/posts/:id               // Get post details
PUT    /api/forum/posts/:id               // Update post
DELETE /api/forum/posts/:id               // Delete post
POST   /api/forum/posts/:id/reactions     // Add reaction
DELETE /api/forum/posts/:id/reactions     // Remove reaction
```

### Search & Discovery
```typescript
GET    /api/forum/search                  // Search threads/posts
GET    /api/forum/trending                // Get trending threads
GET    /api/forum/tags                    // List popular tags
GET    /api/forum/users/:id/posts         // User's post history
```

### Moderation
```typescript
POST   /api/forum/moderation/reports      // Report content
GET    /api/forum/moderation/reports      // List reports (mod)
PUT    /api/forum/moderation/reports/:id  // Resolve report (mod)
POST   /api/forum/moderation/actions      // Mod actions (pin/lock/move)
```

## Frontend Components

### ForumLayout.tsx
```typescript
import { Box, Container } from '@mui/material';
import ForumSidebar from './ForumSidebar';

interface ForumLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function ForumLayout({ children, showSidebar = true }: ForumLayoutProps) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" gap={3}>
        <Box flex={1}>{children}</Box>
        {showSidebar && <ForumSidebar />}
      </Box>
    </Container>
  );
}
```

### CategoryCard.tsx
```typescript
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { ForumCategory } from '@/types/forum';
import Link from 'next/link';

interface CategoryCardProps {
  category: ForumCategory;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Card component={Link} href={`/forum/${category.slug}`} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">{category.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {category.description}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="body2">{category.threadCount} tråder</Typography>
            <Typography variant="caption" color="text.secondary">
              {category.postCount} innlegg
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
```

### PostEditor.tsx
```typescript
import { useState } from 'react';
import { Box, TextField, Button, IconButton, Toolbar } from '@mui/material';
import { 
  FormatBold, 
  FormatItalic, 
  FormatQuote,
  InsertPhoto,
  Code 
} from '@mui/icons-material';

interface PostEditorProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function PostEditor({ 
  onSubmit, 
  placeholder = "Skriv ditt innlegg...",
  initialValue = "" 
}: PostEditorProps) {
  const [content, setContent] = useState(initialValue);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      setContent("");
    }
  };

  return (
    <Box>
      <Toolbar variant="dense" sx={{ border: 1, borderColor: 'divider', borderBottom: 0 }}>
        <IconButton size="small"><FormatBold /></IconButton>
        <IconButton size="small"><FormatItalic /></IconButton>
        <IconButton size="small"><FormatQuote /></IconButton>
        <IconButton size="small"><Code /></IconButton>
        <IconButton size="small"><InsertPhoto /></IconButton>
      </Toolbar>
      <TextField
        multiline
        fullWidth
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        variant="outlined"
        sx={{ '& .MuiOutlinedInput-root': { borderTopLeftRadius: 0, borderTopRightRadius: 0 }}}
      />
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          Publiser
        </Button>
      </Box>
    </Box>
  );
}
```

## Security & Moderation

### Security Measures

1. **Rate Limiting**
   - Thread creation: 5 per hour per user
   - Post creation: 20 per hour per user
   - Reactions: 50 per hour per user

2. **Content Validation**
   - XSS prevention via content sanitization
   - Maximum post length: 10,000 characters
   - Maximum thread title: 200 characters
   - Profanity filter for public content

3. **Permission System**
   - Role-based access (User, Moderator, Admin)
   - Category-specific moderators
   - Owner-only edit/delete (within 30 minutes)

4. **Spam Prevention**
   - New user restrictions (first 5 posts moderated)
   - Link limiting for new users
   - Duplicate content detection
   - CAPTCHA for suspicious activity

### Moderation Features

1. **Content Reports**
   - User reporting with reason selection
   - Moderator queue for review
   - Bulk action capabilities
   - Report resolution tracking

2. **Moderator Actions**
   - Pin/unpin threads
   - Lock/unlock threads
   - Move threads between categories
   - Edit/delete any post
   - Warn/ban users

3. **Admin Controls**
   - Category management
   - Moderator assignment
   - Forum-wide settings
   - Analytics dashboard

## Code Examples

### Hook Example: useForumCategories.ts
```typescript
import { useQuery } from '@tanstack/react-query';

export function useForumCategories() {
  return useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const response = await fetch('/api/forum/categories', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

### Service Example: forum-service.ts
```typescript
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function createThread(
  userId: string,
  data: {
    title: string;
    content: string;
    categoryId: string;
    tags?: string[];
  }
) {
  // Validate user permissions
  const user = await prisma.profiles.findUnique({
    where: { id: userId },
    include: { forum_user_stats: true }
  });

  if (!user) throw new Error('User not found');

  // Check for rate limiting
  const recentThreads = await prisma.forum_threads.count({
    where: {
      authorId: userId,
      createdAt: { gte: new Date(Date.now() - 3600000) } // Last hour
    }
  });

  if (recentThreads >= 5) {
    throw new Error('Rate limit exceeded');
  }

  // Create thread with tags
  const thread = await prisma.forum_threads.create({
    data: {
      title: data.title,
      slug: generateSlug(data.title),
      content: sanitizeContent(data.content),
      authorId: userId,
      categoryId: data.categoryId,
      tags: data.tags ? {
        create: data.tags.map(tag => ({
          tag: {
            connectOrCreate: {
              where: { name: tag },
              create: { 
                name: tag,
                slug: generateSlug(tag)
              }
            }
          }
        }))
      } : undefined
    },
    include: {
      author: {
        select: {
          id: true,
          nickname: true,
          firstname: true,
          lastname: true
        }
      },
      category: true,
      _count: {
        select: { posts: true }
      }
    }
  });

  // Update user stats
  await prisma.forum_user_stats.upsert({
    where: { userId },
    create: {
      userId,
      threadCount: 1
    },
    update: {
      threadCount: { increment: 1 }
    }
  });

  return thread;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function sanitizeContent(content: string): string {
  // Implement content sanitization
  // Remove scripts, sanitize HTML, etc.
  return content;
}
```

### API Route Example: /api/forum/threads/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase-auth-middleware';
import { createThread, getThreads } from '@/services/forum/forum-service';

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const threads = await getThreads({
      categoryId: categoryId || undefined,
      page,
      limit
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
};

export const POST = withAuth(async (request, { profileId }) => {
  try {
    const data = await request.json();
    
    const thread = await createThread(profileId, data);
    
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create thread' },
      { status: 400 }
    );
  }
});
```

## Integration Points

### With Existing Features

1. **Authentication**
   - Use existing Supabase auth
   - Leverage current user profiles
   - Apply requireAuth() pattern for protected pages

2. **Notifications**
   - Integrate with existing notification system
   - Email notifications for subscribed threads
   - In-app notifications for mentions

3. **User Profiles**
   - Add forum stats to profile page
   - Display recent forum activity
   - Show reputation/badges

4. **Search**
   - Extend main search to include forum content
   - Unified search experience
   - Category filtering

5. **Admin Dashboard**
   - Add forum section to existing admin panel
   - Unified moderation tools
   - Combined analytics

## Performance Considerations

1. **Database Optimization**
   - Proper indexing on frequently queried columns
   - Pagination for all list views
   - Efficient query patterns with Prisma

2. **Caching Strategy**
   - Cache category list (5 minutes)
   - Cache user stats (1 minute)
   - Cache trending threads (10 minutes)

3. **Frontend Optimization**
   - Lazy load thread content
   - Virtual scrolling for long post lists
   - Image optimization with next/image
   - Code splitting for forum routes

4. **SEO Considerations**
   - Server-side rendering for thread pages
   - Proper meta tags for each thread
   - Sitemap generation for forum content
   - Structured data for better search visibility

## Testing Strategy

1. **Unit Tests**
   - Service functions
   - Utility functions
   - Component logic

2. **Integration Tests**
   - API endpoints
   - Database operations
   - Authentication flows

3. **E2E Tests (Cypress)**
   - Thread creation flow
   - Post interaction
   - Moderation actions
   - Search functionality

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Rate limiting configured
- [ ] Moderation word list setup
- [ ] Admin users assigned
- [ ] Email templates created
- [ ] Monitoring/logging setup
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Security audit performed

## Future Enhancements

1. **Gamification**
   - User badges/achievements
   - Leaderboards
   - Point system

2. **Advanced Features**
   - Private messaging
   - User groups
   - Event scheduling
   - Polls in threads

3. **Mobile App**
   - React Native companion app
   - Push notifications
   - Offline support

4. **AI Features**
   - Content summarization
   - Auto-tagging
   - Sentiment analysis
   - Smart search

This implementation plan provides a solid foundation for building a professional forum feature that integrates seamlessly with the Stallplass platform while maintaining code quality and user experience standards.