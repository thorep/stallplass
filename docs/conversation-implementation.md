# Conversation/Chat Implementation Guide

## ⚠️ IMPORTANT: Start Fresh

Before implementing this new chat system, we need to completely remove the old implementation:

### 1. Clean Up Existing Code
```bash
# Remove old conversation-related files
rm -rf src/app/dashboard/conversations  # Old conversation page
rm -rf src/components/organisms/MessagingClient.tsx
rm -rf src/components/molecules/MessageThread.tsx
rm -rf src/components/molecules/ConversationList.tsx

# Remove old API endpoints
rm -rf src/app/api/conversations  # All old conversation endpoints

# Remove old hooks
# In src/hooks/useConversations.ts - DELETE the entire file
# In src/hooks/useChat.ts - DELETE if exists
```

### 2. Update Prisma Schema
Remove the old conversation and message models and replace with the new schema shown below. Then run:
```bash
# Create a migration to drop old tables and create new ones
npm run prisma:migrate:dev -- --name fresh_chat_implementation

# Generate new types
npm run prisma:generate
```

### 3. Database is Clean
Old messages and conversations tables have been removed. Ready for fresh implementation.

## Overview

This guide outlines the implementation of real-time chat functionality for Stallplass using:
- **Supabase Realtime** - For real-time message updates (already included in our Supabase plan)
- **@chatscope/chat-ui-kit-react** - For professional chat UI components
- **Prisma** - For database operations (our existing ORM)
- **PostgreSQL** - For message storage (our existing database)

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   React UI  │────▶│  Next.js API │────▶│  Prisma + DB    │
│  Chatscope  │     │   Routes     │     │  (PostgreSQL)   │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                                           │
       │                                           │
       └────────── Supabase Realtime ─────────────┘
                  (Listens to DB changes)
```

## How Prisma and Supabase Realtime Work Together

### The Key Concept

1. **Prisma** handles all database operations (CREATE, READ, UPDATE, DELETE)
2. **PostgreSQL** stores all the data
3. **Supabase Realtime** listens to PostgreSQL's replication stream
4. When Prisma inserts/updates data, Supabase broadcasts the changes

### Step-by-Step Flow

1. User sends a message via the UI
2. API route uses Prisma to insert the message into PostgreSQL
3. PostgreSQL's replication stream detects the change
4. Supabase Realtime broadcasts the change to all subscribed clients
5. React components receive the update and refresh the UI

```typescript
// 1. User sends message (React component)
const sendMessage = async (content: string) => {
  await fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ content, conversationId })
  });
};

// 2. API uses Prisma to insert (Next.js API route)
const message = await prisma.messages.create({
  data: { content, conversationId, senderId }
});

// 3-4. PostgreSQL → Supabase Realtime (automatic)

// 5. React receives update via subscription
supabase
  .channel('messages')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'messages' 
  }, handleNewMessage)
  .subscribe();
```

## Installation

```bash
# Install UI components
npm install @chatscope/chat-ui-kit-react

# Install styles
npm install @chatscope/chat-ui-kit-styles

# Install debounce utility for typing indicator
npm install use-debounce

# Supabase client already installed for auth
# Prisma already installed for database
```

## Database Setup

### 1. Ensure your Prisma schema has the necessary models

```prisma
model conversations {
  id        String             @id @default(uuid())
  userId    String
  stableId  String
  boxId     String?
  status    ConversationStatus @default(ACTIVE)
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
  
  // FUTURE: These snapshots will become unnecessary when we implement
  // soft delete (archived=true) instead of hard delete for boxes/stables
  // Snapshot data for when box/stable is deleted
  boxSnapshot    Json?  // Stores { name, price, image } when box is deleted
  stableSnapshot Json?  // Stores { name } when stable is deleted
  
  user      users              @relation(fields: [userId], references: [id])
  // FUTURE: When we implement soft delete, these will use onDelete: Restrict
  // because archived boxes/stables should never be deleted from DB
  stable    stables            @relation(fields: [stableId], references: [id], onDelete: SetNull)
  box       boxes?             @relation(fields: [boxId], references: [id], onDelete: SetNull)
  messages  messages[]
  
  @@unique([userId, stableId, boxId])
  @@index([stableId])
  @@index([boxId])
}

// FUTURE: Add archived field to boxes and stables
model boxes {
  id                   String              @id @default(uuid())
  name                 String
  description          String?
  price                Int
  size                 Float?
  isAvailable          Boolean             @default(true)
  maxHorseSize         String?
  specialNotes         String?
  images               String[]
  createdAt            DateTime            @default(now())
  updatedAt            DateTime
  stableId             String
  imageDescriptions    String[]
  isSponsored          Boolean             @default(false)
  sponsoredStartDate   DateTime?
  sponsoredUntil       DateTime?
  boxType              BoxType             @default(BOKS)
  advertisingActive    Boolean             @default(false)
  advertisingEndDate   DateTime?
  advertisingStartDate DateTime?
  viewCount            Int                 @default(0)
  availabilityDate     DateTime?
  
  // FUTURE: Add soft delete support
  // archived           Boolean             @default(false)  // Instead of deleting, set archived=true
  // archivedAt         DateTime?           // When the box was archived
  // archivedReason     String?             // Why it was archived (deleted by user, etc.)
  
  box_amenity_links    box_amenity_links[]
  stables              stables             @relation(fields: [stableId], references: [id], onDelete: Cascade)
  conversations        conversations[]
}

model stables {
  id                   String                 @id @default(uuid())
  name                 String
  description          String
  address              String?
  postalCode           String?
  rating               Float                  @default(0)
  reviewCount          Int                    @default(0)
  images               String[]
  createdAt            DateTime               @default(now())
  updatedAt            DateTime
  ownerId              String
  latitude             Float
  longitude            Float
  imageDescriptions    String[]
  countyId             String?
  municipalityId       String?
  postalPlace          String?
  viewCount            Int                    @default(0)
  
  // FUTURE: Add soft delete support
  // archived           Boolean                @default(false)  // Instead of deleting, set archived=true
  // archivedAt         DateTime?              // When the stable was archived
  // archivedReason     String?                // Why it was archived (deleted by user, etc.)
  
  boxes                boxes[]
  conversations        conversations[]
  invoice_requests     invoice_requests[]
  stable_amenity_links stable_amenity_links[]
  stable_faqs          stable_faqs[]
  counties             counties?              @relation(fields: [countyId], references: [id])
  municipalities       municipalities?        @relation(fields: [municipalityId], references: [id])
  users                users                  @relation(fields: [ownerId], references: [id], onDelete: Cascade)
}

model messages {
  id             String        @id @default(uuid())
  conversationId String
  senderId       String
  content        String
  messageType    MessageType   @default(TEXT)
  metadata       Json?
  isRead         Boolean       @default(false)
  createdAt      DateTime      @default(now())
  
  conversation   conversations @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         users         @relation(fields: [senderId], references: [id], onDelete: Cascade)
}

enum MessageType {
  TEXT
  IMAGE
  STABLE_LINK
  BOX_LINK
}

enum ConversationStatus {
  ACTIVE
  ARCHIVED
  BLOCKED
}
```

### 2. Enable Realtime for the messages table

Run this in Supabase SQL editor:

```sql
-- Enable realtime for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable realtime for conversations table (for status updates)
ALTER TABLE conversations REPLICA IDENTITY FULL;
```

Then in Supabase Dashboard:
1. Go to Database → Replication
2. Toggle on `messages` table
3. Toggle on `conversations` table

## Implementation

### 1. Create Realtime Hook

```typescript
// hooks/useRealtimeMessages.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function useRealtimeMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversationId=eq.${conversationId}`
        },
        (payload) => {
          // Invalidate and refetch messages
          queryClient.invalidateQueries({ 
            queryKey: ['messages', conversationId] 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversationId=eq.${conversationId}`
        },
        (payload) => {
          // Handle message updates (read receipts, etc.)
          queryClient.invalidateQueries({ 
            queryKey: ['messages', conversationId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}
```

### 2. Create Typing Indicator Hook with Three Dots Animation

```typescript
// hooks/useTypingIndicator.ts
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/supabase-auth-context';
import { useDebouncedCallback } from 'use-debounce';

export function useTypingIndicator(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { user } = useAuth();
  const supabase = createClient();
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    // Track typing state
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing = Object.entries(state)
          .filter(([key, value]: [string, any]) => {
            return value[0]?.typing && key !== user?.id;
          })
          .map(([key, value]: [string, any]) => value[0]?.userName);
        
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  // Debounced typing indicator
  const setTyping = useDebouncedCallback((isTyping: boolean) => {
    if (!channelRef.current) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Track typing state
    channelRef.current.track({
      typing: isTyping,
      userName: user?.name || 'Bruker',
      userId: user?.id
    });

    // Auto-stop typing after 3 seconds of no activity
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current.track({
          typing: false,
          userName: user?.name || 'Bruker',
          userId: user?.id
        });
      }, 3000);
    }
  }, 300); // Debounce for 300ms

  return { typingUsers, setTyping };
}

// components/atoms/TypingIndicator.tsx
import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center space-x-2 px-4 py-2">
      <span className="text-sm text-gray-500">
        {userName || 'Noen'} skriver
      </span>
      <div className="flex space-x-1">
        <span className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full" 
              style={{ animationDelay: '0ms' }}></span>
        <span className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full" 
              style={{ animationDelay: '150ms' }}></span>
        <span className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full" 
              style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
}

// Add to your Tailwind CSS (if not already included)
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        bounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        bounce: 'bounce 1.4s infinite ease-in-out',
      }
    }
  }
}
```

### 3. Create Message Hooks (Following TanStack Query Pattern)

```typescript
// hooks/useConversations.ts (add to existing file)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';
import type { messages } from '@/generated/prisma';

// Query keys factory
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filters: any) => [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (conversationId: string) => [...conversationKeys.detail(conversationId), 'messages'] as const,
};

export function useGetConversationMessages(conversationId: string) {
  const { getIdToken } = useAuth();
  
  return useQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch messages: ${response.statusText}`);
      }
      return response.json() as Promise<messages[]>;
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds - shorter for chat
    refetchInterval: false, // Rely on realtime updates
  });
}

export function usePostMessage() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      messageType = 'TEXT' 
    }: {
      conversationId: string;
      content: string;
      messageType?: string;
    }) => {
      const token = await getIdToken();
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content, messageType })
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to send message: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate messages to refetch with new message
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.messages(variables.conversationId) 
      });
      // Also invalidate conversation list to update last message
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.lists() 
      });
    }
  });
}

export function usePutMessagesRead() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const token = await getIdToken();
      const response = await fetch(
        `/api/conversations/${conversationId}/mark-read`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to mark messages as read: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data, conversationId) => {
      // Invalidate to update read status
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.messages(conversationId) 
      });
      // Update conversation list unread counts
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.lists() 
      });
    }
  });
}
```

### 4. Create Chat Component

```typescript
// components/organisms/ConversationChat.tsx
import { useEffect, useRef } from 'react';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  Avatar,
  MessageSeparator
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

import { useAuth } from '@/lib/supabase-auth-context';
import { useGetConversationMessages, usePostMessage, usePutMessagesRead } from '@/hooks/useConversations';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { TypingIndicator } from '@/components/atoms/TypingIndicator';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ConversationChatProps {
  conversation: {
    id: string;
    stable: {
      id: string;
      name: string;
      images: string[];
      owner: {
        id: string;
        name: string;
        avatar?: string;
      };
    };
    box?: {
      id: string;
      name: string;
      price: number;
    };
  };
}

export function ConversationChat({ conversation }: ConversationChatProps) {
  const { user } = useAuth();
  const messageListRef = useRef<HTMLDivElement>(null);
  
  // Hooks (following project's TanStack Query patterns)
  const { data: messages, isLoading } = useGetConversationMessages(conversation.id);
  const { mutate: sendMessage } = usePostMessage();
  const { mutate: markAsRead } = usePutMessagesRead();
  const { typingUsers, setTyping } = useTypingIndicator(conversation.id);
  
  // Enable realtime updates
  useRealtimeMessages(conversation.id);
  
  // Mark messages as read when viewing
  useEffect(() => {
    if (conversation.id) {
      markAsRead(conversation.id);
    }
  }, [conversation.id, messages]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = (content: string) => {
    sendMessage({
      conversationId: conversation.id,
      content
    });
    setTyping(false);
  };
  
  const isOwnMessage = (senderId: string) => senderId === user?.id;
  
  // Determine who the other user is
  const otherUser = conversation.stable.owner.id === user?.id 
    ? messages?.[0]?.sender // First message sender if we're the owner
    : conversation.stable.owner;
  
  return (
    <MainContainer style={{ height: '600px' }}>
      <ChatContainer>
        <ConversationHeader>
          <Avatar 
            src={otherUser?.avatar || '/default-avatar.png'} 
            name={otherUser?.name || 'Bruker'} 
          />
          <ConversationHeader.Content 
            userName={otherUser?.name || 'Bruker'}
            info={conversation.box 
              ? `${conversation.box.name} - ${conversation.box.price} kr/mnd`
              : conversation.stable.name
            }
          />
        </ConversationHeader>
        
        <MessageList 
          ref={messageListRef}
          loading={isLoading}
          typingIndicator={
            typingUsers.length > 0 && (
              <TypingIndicator userName={typingUsers[0]} />
            )
          }
        >
          {/* Group messages by date */}
          {messages?.map((msg, index) => {
            const showDateSeparator = index === 0 || 
              new Date(msg.createdAt).toDateString() !== 
              new Date(messages[index - 1].createdAt).toDateString();
            
            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <MessageSeparator 
                    content={formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                      locale: nb
                    })} 
                  />
                )}
                
                <Message
                  model={{
                    message: msg.content,
                    sentTime: msg.createdAt,
                    sender: msg.sender.name,
                    direction: isOwnMessage(msg.senderId) ? 'outgoing' : 'incoming',
                    position: 'single'
                  }}
                  avatarSpacer={isOwnMessage(msg.senderId)}
                >
                  {!isOwnMessage(msg.senderId) && (
                    <Avatar 
                      src={msg.sender.avatar || '/default-avatar.png'} 
                      name={msg.sender.name} 
                    />
                  )}
                </Message>
              </div>
            );
          })}
        </MessageList>
        
          <MessageInput 
            placeholder="Skriv en melding..."
            onSend={handleSend}
            style={{
              minHeight: '44px', // iOS minimum touch target
              fontSize: '16px' // Prevents zoom on iOS
            }}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
```

### 5. Create API Routes

```typescript
// app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: conversationId } = await params;

  // Verify user is part of this conversation
  const conversation = await prisma.conversations.findFirst({
    where: {
      id: conversationId,
      OR: [
        { userId: auth.uid },
        { stable: { ownerId: auth.uid } }
      ]
    }
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Fetch messages
  const messages = await prisma.messages.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const { content, messageType = 'TEXT' } = await request.json();

  // Verify user is part of this conversation
  const conversation = await prisma.conversations.findFirst({
    where: {
      id: conversationId,
      OR: [
        { userId: auth.uid },
        { stable: { ownerId: auth.uid } }
      ]
    }
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Create message
  const message = await prisma.messages.create({
    data: {
      conversationId,
      senderId: auth.uid,
      content,
      messageType
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  // Update conversation updatedAt
  await prisma.conversations.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  // Supabase Realtime will automatically broadcast this change
  return NextResponse.json(message);
}
```

```typescript
// app/api/conversations/[id]/mark-read/route.ts (Note: PUT method to match hook name)
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: conversationId } = await params;

  // Mark all messages as read
  await prisma.messages.updateMany({
    where: {
      conversationId,
      senderId: { not: auth.uid },
      isRead: false
    },
    data: { isRead: true }
  });

  return NextResponse.json({ success: true });
}
```

## Mobile Considerations

Following the project's mobile-first modal pattern:

```typescript
// components/organisms/ConversationModal.tsx
export function ConversationModal({ 
  conversation, 
  isOpen, 
  onClose 
}: ConversationModalProps) {
  return (
    <div className={`
      fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center 
      justify-center z-50 p-0 sm:p-4 ${isOpen ? '' : 'hidden'}
    `}>
      <div className="
        bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-4xl 
        max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col
      ">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Meldinger</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ConversationChat conversation={conversation} />
        </div>
      </div>
    </div>
  );
}
```

## Testing Checklist

- [ ] Messages appear in real-time without refresh
- [ ] Typing indicators work across users
- [ ] Read receipts update correctly
- [ ] Messages persist after page refresh
- [ ] Conversation list updates with new messages
- [ ] Mobile UI works properly
- [ ] Images can be sent (if implemented)
- [ ] Messages are properly ordered
- [ ] User can't access other users' conversations
- [ ] Deleted stables cascade delete conversations

## Performance Optimizations

1. **Message Pagination** (for long conversations):
```typescript
const messages = await prisma.messages.findMany({
  where: { conversationId },
  take: 50, // Load last 50 messages
  skip: page * 50,
  orderBy: { createdAt: 'desc' }
});
```

2. **Debounce Typing Indicators**:
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSetTyping = useDebouncedCallback(
  (isTyping: boolean) => setTyping(isTyping),
  300
);
```

3. **Image Optimization**:
```typescript
// Use Next.js Image component for avatar images
import Image from 'next/image';

<Avatar>
  <Image 
    src={user.avatar} 
    alt={user.name}
    width={40}
    height={40}
    quality={75}
  />
</Avatar>
```

## Handling Deleted Boxes/Stables

When a box or stable is deleted, we want to preserve the conversation history but indicate that the item is no longer available. Here's how to handle this:

### 1. Create Database Trigger to Snapshot Data

```sql
-- Run this in Supabase SQL editor after creating tables

-- Trigger to snapshot box data before deletion
CREATE OR REPLACE FUNCTION snapshot_box_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversations with box snapshot
  UPDATE conversations
  SET boxSnapshot = jsonb_build_object(
    'name', OLD.name,
    'price', OLD.price,
    'images', OLD.images[1], -- First image only
    'deletedAt', NOW()
  )
  WHERE boxId = OLD.id;
  
  -- Set boxId to NULL (onDelete: SetNull)
  UPDATE conversations
  SET boxId = NULL
  WHERE boxId = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_box_delete
BEFORE DELETE ON boxes
FOR EACH ROW
EXECUTE FUNCTION snapshot_box_before_delete();

-- Similar trigger for stables
CREATE OR REPLACE FUNCTION snapshot_stable_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET stableSnapshot = jsonb_build_object(
    'name', OLD.name,
    'deletedAt', NOW()
  )
  WHERE stableId = OLD.id;
  
  UPDATE conversations
  SET stableId = NULL
  WHERE stableId = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_stable_delete
BEFORE DELETE ON stables
FOR EACH ROW
EXECUTE FUNCTION snapshot_stable_before_delete();
```

### 2. Update Conversation Display

```typescript
// types/conversation.ts
interface BoxSnapshot {
  name: string;
  price: number;
  images?: string;
  deletedAt: string;
}

interface ConversationWithSnapshot extends conversations {
  boxSnapshot?: BoxSnapshot;
  stableSnapshot?: { name: string; deletedAt: string };
}

// components/organisms/ConversationChat.tsx
export function ConversationChat({ conversation }: { conversation: ConversationWithSnapshot }) {
  const isBoxDeleted = !conversation.box && conversation.boxSnapshot;
  const isStableDeleted = !conversation.stable && conversation.stableSnapshot;
  
  // Determine display info
  const boxInfo = conversation.box || conversation.boxSnapshot;
  const stableInfo = conversation.stable || conversation.stableSnapshot;
  
  return (
    <MainContainer style={{ height: '600px' }}>
      <ChatContainer>
        <ConversationHeader>
          <Avatar 
            src={otherUser?.avatar || '/default-avatar.png'} 
            name={otherUser?.name || 'Bruker'} 
          />
          <ConversationHeader.Content 
            userName={otherUser?.name || 'Bruker'}
            info={
              <div className="flex flex-col">
                <span className={isBoxDeleted ? 'line-through text-gray-400' : ''}>
                  {boxInfo ? `${boxInfo.name} - ${boxInfo.price} kr/mnd` : stableInfo?.name}
                </span>
                {isBoxDeleted && (
                  <span className="text-xs text-red-500">
                    Boksen er slettet
                  </span>
                )}
                {isStableDeleted && (
                  <span className="text-xs text-red-500">
                    Stallen er slettet
                  </span>
                )}
              </div>
            }
          />
        </ConversationHeader>
        
        {/* Show warning banner if box is deleted */}
        {isBoxDeleted && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <p className="text-sm text-yellow-800">
              ⚠️ Denne boksen er ikke lenger tilgjengelig. Du kan fortsatt se meldingshistorikken, men ikke sende nye meldinger.
            </p>
          </div>
        )}
        
        <MessageList>
          {/* Messages */}
        </MessageList>
        
        <MessageInput 
          placeholder={
            isBoxDeleted 
              ? "Boksen er slettet - kan ikke sende nye meldinger"
              : conversation.status === 'ARCHIVED'
              ? "Samtalen er arkivert"
              : "Skriv en melding..."
          }
          onSend={handleSend}
          disabled={isBoxDeleted || conversation.status === 'ARCHIVED'}
        />
      </ChatContainer>
    </MainContainer>
  );
}
```

### 3. Update Conversation List Display

```typescript
// components/molecules/ConversationListItem.tsx
export function ConversationListItem({ conversation }: { conversation: ConversationWithSnapshot }) {
  const boxInfo = conversation.box || conversation.boxSnapshot;
  const isDeleted = !conversation.box && conversation.boxSnapshot;
  
  return (
    <div className={`
      p-4 hover:bg-gray-50 cursor-pointer border-b
      ${isDeleted ? 'opacity-75' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {conversation.otherUser.name}
          </h4>
          <p className={`text-sm ${isDeleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
            {boxInfo?.name} - {boxInfo?.price} kr/mnd
          </p>
          {isDeleted && (
            <p className="text-xs text-red-500 mt-1">
              Boksen er slettet
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(conversation.lastMessage.createdAt)}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1 mt-1">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-1 truncate">
        {conversation.lastMessage.content}
      </p>
    </div>
  );
}
```

### 4. Business Logic for Deleted Boxes

```typescript
// Consider these business rules:

// 1. Archive conversations automatically after 30 days if box is deleted
const archiveOldDeletedConversations = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await prisma.conversations.updateMany({
    where: {
      boxId: null,
      boxSnapshot: { not: null },
      status: 'ACTIVE',
      updatedAt: { lt: thirtyDaysAgo }
    },
    data: {
      status: 'ARCHIVED'
    }
  });
};

// 2. Prevent new messages if box is deleted or conversation is archived
// FUTURE: When soft delete is implemented, this becomes:
// if (conversation.box?.archived) { ... }
if (!conversation.box && conversation.boxSnapshot) {
  return NextResponse.json(
    { error: 'Boksen er slettet - kan ikke sende nye meldinger' },
    { status: 400 }
  );
}

if (conversation.status === 'ARCHIVED') {
  return NextResponse.json(
    { error: 'Denne samtalen er arkivert' },
    { status: 400 }
  );
}

// 3. Auto-disable typing indicator when box is deleted
const debouncedSetTyping = useDebouncedCallback(
  (isTyping: boolean) => {
    // Don't send typing indicator if box is deleted
    if (!conversation.box && conversation.boxSnapshot) return;
    setTyping(isTyping);
  },
  300
);
```

## Summary: User Experience for Deleted Boxes

When a box is deleted, here's exactly what happens:

### ✅ **What Users CAN Do:**
- View all previous messages in the conversation
- See the conversation in their message list
- Know what box they were discussing (via snapshot data)
- Understand why they can't send new messages

### ❌ **What Users CANNOT Do:**
- Send new messages
- Send typing indicators
- Reactivate the conversation

### 📱 **Visual Indicators:**
```
Conversation Header:  "B̶o̶k̶s̶ ̶1̶2̶ ̶-̶ ̶3̶5̶0̶0̶ ̶k̶r̶/̶m̶n̶d̶"
                     "Boksen er slettet"

Warning Banner:      "⚠️ Denne boksen er ikke lenger tilgjengelig. 
                      Du kan fortsatt se meldingshistorikken, 
                      men ikke sende nye meldinger."

Message Input:       "Boksen er slettet - kan ikke sende nye meldinger"
                     (Disabled/grayed out)

Conversation List:   Slightly faded with "Boksen er slettet" text
```

### 🔒 **Backend Protection:**
- API prevents new message creation
- Error message: "Boksen er slettet - kan ikke sende nye meldinger"
- HTTP 400 status returned

This ensures users understand the situation while preserving valuable conversation history for reference.

## 🔮 Future Implementation: Soft Delete (Archived Records)

**IMPORTANT**: In the future, we will implement soft delete instead of hard delete for stables and boxes to maintain complete records for legal/audit purposes.

### Current vs Future Approach

```typescript
// CURRENT: Hard delete (actually removes from database)
await prisma.boxes.delete({ where: { id: boxId } });
// Result: Box is gone forever, conversations need snapshots

// FUTURE: Soft delete (mark as archived)
await prisma.boxes.update({ 
  where: { id: boxId }, 
  data: { 
    archived: true,
    archivedAt: new Date(),
    archivedReason: 'DELETED_BY_USER' // or 'POLICY_VIOLATION', etc.
  }
});
// Result: Box still exists in DB but hidden from users
```

### Future Schema Changes

```prisma
model boxes {
  // ... existing fields ...
  
  // Soft delete fields
  archived       Boolean   @default(false)  // true = "deleted" to users
  archivedAt     DateTime? // When it was archived
  archivedReason String?   // Why it was archived
  
  // All queries will filter by archived=false by default
}

model stables {
  // ... existing fields ...
  
  // Soft delete fields  
  archived       Boolean   @default(false)  // true = "deleted" to users
  archivedAt     DateTime? // When it was archived
  archivedReason String?   // Why it was archived
}
```

### Benefits of Soft Delete

1. **Legal Protection**: Complete audit trail for disputes
2. **Data Recovery**: Can restore "deleted" items if needed
3. **Analytics**: Better understanding of user behavior
4. **Compliance**: Meet data retention requirements
5. **Simpler Conversations**: No need for snapshots - just check archived status

### Future Conversation Logic

```typescript
// Instead of checking snapshots, check archived status
const isBoxArchived = conversation.box?.archived || false;
const isStableArchived = conversation.stable?.archived || false;

// Conversations become read-only when box/stable is archived
const canSendMessages = !isBoxArchived && !isStableArchived && 
                       conversation.status === 'ACTIVE';

// Display logic
const displayInfo = isBoxArchived 
  ? `${conversation.box.name} - ${conversation.box.price} kr/mnd (Ikke tilgjengelig)`
  : `${conversation.box.name} - ${conversation.box.price} kr/mnd`;
```

### Migration Strategy

When implementing soft delete:

1. **Add archived fields** to existing tables
2. **Update all queries** to filter `WHERE archived = false`
3. **Change delete operations** to update operations
4. **Remove snapshot logic** from conversations
5. **Update UI** to use archived status instead of snapshots

### Current Implementation Note

```typescript
// TODO: Replace with soft delete in the future
// For now, we use hard delete + snapshots as a temporary solution
// When soft delete is implemented:
// - Remove boxSnapshot/stableSnapshot fields
// - Remove database triggers
// - Change onDelete: SetNull to onDelete: Restrict
// - Update all "delete" operations to set archived=true
```

This approach ensures we maintain complete data integrity while providing the same user experience.

## Security Considerations

1. **Always verify conversation access** in API routes
2. **Sanitize message content** to prevent XSS
3. **Validate message types** before storing
4. **Rate limit message sending** to prevent spam
5. **Use row-level security** in Supabase for extra protection
6. **Handle deleted items gracefully** to preserve conversation context
7. **Prevent messaging on deleted boxes** both client and server-side

## Future Enhancements

1. **File/Image Uploads**: Use Supabase Storage
2. **Voice Messages**: Store audio files in Storage
3. **Message Reactions**: Add reactions table
4. **Message Search**: Full-text search with PostgreSQL
5. **Push Notifications**: Use Supabase Edge Functions
6. **Message Encryption**: End-to-end encryption for sensitive data