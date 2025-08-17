'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  MessageSeparator
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { useWindowSize } from 'react-use';

import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useGetConversationMessages, usePostMessage, usePutMessagesRead } from '@/hooks/useConversations';
import type { MessageWithSender } from '@/services/chat-service';
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
      ownerId: string;
    } | null;
    box?: {
      id: string;
      name: string;
      price: number;
    } | null;
    // Snapshot data for deleted items
    stableSnapshot?: {
      name: string;
      deletedAt: string;
    };
    boxSnapshot?: {
      name: string;
      price: number;
      images?: string;
      deletedAt: string;
    };
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

export function ConversationChat({ conversation }: ConversationChatProps) {
  const { user } = useSupabaseUser();
  const messageListRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { height: windowHeight } = useWindowSize();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Hooks (following project's TanStack Query patterns)
  const { data: messages, isLoading, refetch } = useGetConversationMessages(conversation.id);
  const { mutate: sendMessage, isPending: isSending } = usePostMessage();
  const { mutate: markAsRead } = usePutMessagesRead();
  const { typingProfiles, setTypingDebounced } = useTypingIndicator(conversation.id);
  
  // Enable real-time updates
  useRealtimeMessages(conversation.id);
  
  // Mobile keyboard detection
  useEffect(() => {
    const handleResize = () => {
      // On mobile, when virtual keyboard opens, window height decreases significantly
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const heightDifference = window.screen.height - window.innerHeight;
        setIsKeyboardOpen(heightDifference > 200); // Threshold for keyboard detection
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Pull-to-refresh functionality
  const handlePullToRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  
  // Touch handling for pull-to-refresh
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isDownSwipe = distance < -50;
    
    // Pull down at top of messages to refresh
    if (isDownSwipe && messageListRef.current?.scrollTop === 0 && !refreshing) {
      handlePullToRefresh();
    }
  };

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversation.id) {
      markAsRead(conversation.id);
    }
  }, [conversation.id, messages, markAsRead]);
  
  // Scroll to bottom on new messages and keyboard open
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isKeyboardOpen]);
  
  const handleSend = (content: string) => {
    if (!content.trim()) return;
    
    // Stop typing indicator immediately when sending
    setTypingDebounced(false);
    
    sendMessage({
      conversationId: conversation.id,
      content: content.trim()
    });
  };
  
  // Calculate dynamic height for mobile
  const chatHeight = isKeyboardOpen 
    ? `${windowHeight - 100}px` // Adjust for keyboard
    : '600px';

  const isOwnMessage = (senderId: string) => senderId === user?.id;
  
  // Determine who the other user is
  const otherUser = conversation.stable?.ownerId === user?.id 
    ? conversation.user // If we're the stable owner, other user is the one who started conversation
    : { // If we're the conversation starter, other user is the stable owner
        id: conversation.stable?.ownerId || '',
        name: 'Stable Owner', // Will need to get this from API
        avatar: undefined
      };

  // Check if box/stable is deleted
  const isBoxDeleted = !conversation.box && conversation.boxSnapshot;
  const isStableDeleted = !conversation.stable && conversation.stableSnapshot;
  
  // Determine display info
  const boxInfo = conversation.box || conversation.boxSnapshot;
  const stableInfo = conversation.stable || conversation.stableSnapshot;
  
  // Determine if messaging is disabled
  const canSendMessages = !isBoxDeleted && !isStableDeleted;
  
  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full"
      style={{ height: chatHeight }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {refreshing && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 z-10">
          Oppdaterer meldinger...
        </div>
      )}
      
      <MainContainer style={{ height: '100%' }}>
        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Content 
              userName={otherUser?.name || 'Bruker'}
              info={
                <div className="flex flex-col">
                  <span className={isBoxDeleted || isStableDeleted ? 'line-through text-gray-400' : ''}>
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
          
          {/* Show warning banner if box/stable is deleted */}
          {(isBoxDeleted || isStableDeleted) && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
              <p className="text-sm text-yellow-800">
                ⚠️ {isBoxDeleted ? 'Denne boksen' : 'Denne stallen'} er ikke lenger tilgjengelig. 
                Du kan fortsatt se meldingshistorikken, men ikke sende nye meldinger.
              </p>
            </div>
          )}
          
          <MessageList 
            ref={messageListRef}
            loading={isLoading}
            typingIndicator={
              typingProfiles.length > 0 && (
                <TypingIndicator userName={typingProfiles[0]} />
              )
            }
            style={{ 
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
            }}
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
                      sentTime: msg.createdAt ? new Date(msg.createdAt).toISOString() : '',
                      sender: (msg as MessageWithSender).sender?.nickname || 'Bruker finnes ikke',
                      direction: isOwnMessage(msg.senderId) ? 'outgoing' : 'incoming',
                      position: 'single'
                    }}
                  />
                </div>
              );
            })}
          </MessageList>
          
          <MessageInput 
            placeholder={
              !canSendMessages 
                ? isBoxDeleted 
                  ? "Boksen er slettet - kan ikke sende nye meldinger"
                  : "Stallen er slettet - kan ikke sende nye meldinger"
                : "Skriv en melding..."
            }
            onSend={handleSend}
            onChange={(innerHtml, textContent) => {
              // Trigger typing indicator when user is typing
              setTypingDebounced(textContent.length > 0);
            }}
            onBlur={() => {
              // Stop typing indicator when input loses focus
              setTypingDebounced(false);
            }}
            disabled={!canSendMessages || isSending}
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