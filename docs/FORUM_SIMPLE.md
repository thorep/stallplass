# Simple Forum Implementation for Stallplass

## Overview
A kick-ass, Reddit-style forum with minimal complexity. Focus on core functionality that users actually need.

## Database Schema (3 tables max!)

```prisma
// One table for threads AND replies
model forum_posts {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  title     String?  // Only threads have titles (parentId = null)
  content   String   @db.Text
  authorId  String
  parentId  String?  // null = thread, value = reply to thread
  viewCount Int      @default(0) // Only for threads
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  author   profiles      @relation(fields: [authorId], references: [id])
  parent   forum_posts?  @relation("Replies", fields: [parentId], references: [id])
  replies  forum_posts[] @relation("Replies")
  reactions forum_reactions[]
  
  @@index([parentId, createdAt]) // For thread listing and replies
  @@index([authorId])
  @@index([createdAt])
}

// Simple reactions system
model forum_reactions {
  id     String @id @default(dbgenerated("gen_random_uuid()"))
  postId String
  userId String
  type   String // "like", "helpful", "thanks"
  createdAt DateTime @default(now())
  
  post forum_posts @relation(fields: [postId], references: [id], onDelete: Cascade)
  user profiles    @relation(fields: [userId], references: [id])
  
  @@unique([postId, userId, type])
  @@index([postId])
}

// Optional: Simple tags for threads
model forum_tags {
  id       String @id @default(dbgenerated("gen_random_uuid()"))
  threadId String
  name     String
  
  thread forum_posts @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  @@index([name])
  @@index([threadId])
}
```

## File Structure (Minimal)

```
src/
├── app/forum/
│   ├── page.tsx              # Thread list (home)
│   ├── [id]/page.tsx         # Thread view with replies  
│   ├── ny/page.tsx           # Create new thread
│   └── layout.tsx            # Forum layout
│
├── api/forum/
│   ├── posts/
│   │   ├── route.ts          # GET threads, POST new thread
│   │   └── [id]/
│   │       ├── route.ts      # GET thread, PUT update, DELETE
│   │       └── replies/
│   │           └── route.ts  # GET replies, POST new reply
│   └── reactions/
│       └── route.ts          # POST add reaction, DELETE remove
│
├── components/forum/
│   ├── ThreadList.tsx        # List all threads
│   ├── ThreadCard.tsx        # One thread in list
│   ├── PostCard.tsx          # One post/reply
│   ├── ReplyForm.tsx         # Create reply
│   ├── ThreadForm.tsx        # Create/edit thread
│   └── ReactionButtons.tsx   # Like/helpful buttons
│
├── hooks/forum/
│   ├── useThreads.ts         # List threads
│   ├── useThread.ts          # Get single thread + replies
│   ├── useCreateThread.ts    # Create thread
│   ├── useCreateReply.ts     # Create reply
│   └── useReactions.ts       # Handle likes/reactions
│
└── services/forum/
    ├── forum-service.ts      # CRUD operations
    └── types.ts              # TypeScript types
```

## Core Features (MVP)

1. **Thread List** - Show all threads sorted by latest activity
2. **Thread View** - Show thread + all replies in chronological order
3. **Create Thread** - Simple form with title + content
4. **Reply to Thread** - Add reply to any thread
5. **Reactions** - Like, Helpful buttons on posts
6. **Author Info** - Show username, join date, post count
7. **Edit/Delete** - Authors can edit/delete own posts (30 min limit)

## UI Design (Reddit-style)

### Thread List Page
```
┌─ FORUM ────────────────────────────────────┐
│ [Ny tråd]                    [🔍 Søk]      │
├────────────────────────────────────────────┤
│ 📌 Viktige spørsmål før du kjøper hest     │ 
│    av @admin • 2 dager siden • 15 svar     │
├────────────────────────────────────────────┤
│ 💬 Beste pellets til vinteren?             │
│    av @hestejente22 • 4 timer siden • 3 sv │
├────────────────────────────────────────────┤
│ 🏇 Tips til ridning i regn                 │
│    av @ridestallnord • 1 dag siden • 8 sv  │
└────────────────────────────────────────────┘
```

### Thread View Page
```
┌─ Tips til ridning i regn ──────────────────┐
│ av @ridestallnord • 1 dag siden            │
│                                            │
│ Hei alle! Har dere gode tips til å ri når  │
│ det regner? Blir alltid så glatt...        │
│                                            │
│ [👍 5] [🔥 2] [Svar]                        │
├────────────────────────────────────────────┤
│ @hestejente22 • 20 timer siden             │
│ Jeg bruker alltid sko med god gripeverdi!  │
│ [👍 3] [Svar til dette]                    │
├────────────────────────────────────────────┤
│ @admin • 15 timer siden                    │
│ Viktig å sjekke underlag før man begynner  │
│ [👍 8] [🔥 1] [Svar til dette]             │
└────────────────────────────────────────────┘
[📝 Skriv svar...]
```

## Implementation Plan (2 days)

### Day 1: Backend + Basic Pages
1. **Database** (1 hour)
   - Add forum schema to Prisma
   - Generate migration
   - Update profiles relation

2. **API Routes** (3 hours)
   - `/api/forum/posts` - CRUD for threads
   - `/api/forum/posts/[id]/replies` - CRUD for replies
   - `/api/forum/reactions` - Add/remove reactions

3. **Basic Pages** (4 hours)
   - Forum home page (thread list)
   - Thread view page
   - Create thread page
   - Simple layout wrapper

### Day 2: UI Polish + Features
1. **Components** (4 hours)
   - ThreadCard with author info
   - PostCard with reactions
   - Reply form with rich editor
   - Reaction buttons

2. **Hooks & Services** (2 hours)
   - TanStack Query hooks
   - Service functions
   - Error handling

3. **Polish** (2 hours)
   - Mobile responsive design
   - Loading states
   - Error boundaries
   - Basic styling with MUI

## Key Design Decisions

1. **No Categories** - Keep it simple, use search/tags later
2. **No Complex Permissions** - Only author can edit/delete
3. **One Table Strategy** - Threads and replies in same table
4. **Simple Reactions** - Just strings, not enums
5. **Chronological Replies** - No nested threading (like Reddit comments)
6. **Server-side Auth** - Use existing requireAuth() pattern
7. **MUI Components** - Consistent with app design

## Nice-to-Have Features (Later)

- Search forum posts
- Tag system for threads
- User mention (@username)
- Rich text formatting (bold, italic)
- Image uploads in posts
- Email notifications
- Moderation tools
- User reputation system

## Technical Details

### Efficient Queries
```typescript
// Get thread with reply count
const threadsWithStats = await prisma.forum_posts.findMany({
  where: { parentId: null }, // Only threads
  include: {
    author: { select: { nickname: true, createdAt: true }},
    _count: { select: { replies: true }},
    reactions: { select: { type: true }}
  },
  orderBy: { updatedAt: 'desc' },
  take: 20
});

// Get thread with all replies
const threadWithReplies = await prisma.forum_posts.findUnique({
  where: { id: threadId },
  include: {
    author: { select: { nickname: true, createdAt: true }},
    replies: {
      include: {
        author: { select: { nickname: true, createdAt: true }},
        reactions: { select: { type: true, userId: true }}
      },
      orderBy: { createdAt: 'asc' }
    },
    reactions: { select: { type: true, userId: true }}
  }
});
```

### Performance Optimizations
- Pagination for thread lists (20 per page)
- Index on `parentId, createdAt` for fast queries
- Debounced search
- Optimistic updates for reactions
- Cache thread lists for 1 minute

This simple approach gives you 90% of what users want in a forum, with 10% of the complexity!