'use client';

import { 
  Card, 
  CardContent, 
  Stack, 
  Typography, 
  Avatar, 
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ChatBubbleOutline, 
  VisibilityOutlined,
  AccessTime,
  PushPin,
  Lock
} from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { CategoryBadge } from './CategoryBadge';
import { ReactionDisplay } from './ReactionButtons';
import type { ForumThread } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ThreadCardProps {
  thread: ForumThread;
  user?: User | null;
  onClick?: () => void;
  className?: string;
  showCategory?: boolean;
  compact?: boolean;
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Nå nettopp';
  if (minutes < 60) return `${minutes} min siden`;
  if (hours < 24) return `${hours} time${hours !== 1 ? 'r' : ''} siden`;
  if (days < 7) return `${days} dag${days !== 1 ? 'er' : ''} siden`;
  
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  }).format(new Date(date));
}

// Helper to get user display name
function getUserDisplayName(author: ForumThread['author']): string {
  if (author.nickname) return author.nickname;
  if (author.firstname || author.lastname) {
    return [author.firstname, author.lastname].filter(Boolean).join(' ');
  }
  return 'Anonym bruker';
}

// Helper to get user initials for avatar
function getUserInitials(author: ForumThread['author']): string {
  const name = getUserDisplayName(author);
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function ThreadCard({
  thread,
  user,
  onClick,
  className,
  showCategory = true,
  compact = false
}: ThreadCardProps) {
  const lastActivityDate = thread.lastReplyAt || thread.createdAt;
  const lastActivityUser = thread.lastReply?.author || thread.author;
  
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01]',
        thread.isPinned && 'ring-2 ring-yellow-200 bg-yellow-50',
        className
      )}
      onClick={onClick}
      sx={{ 
        borderRadius: 2,
        '&:hover': {
          borderColor: 'primary.main'
        }
      }}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <Stack spacing={compact ? 2 : 3}>
          {/* Header with title and status indicators */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {thread.isPinned && (
                  <Tooltip title="Festet innlegg">
                    <PushPin className="text-yellow-600" fontSize="small" />
                  </Tooltip>
                )}
                
                {thread.isLocked && (
                  <Tooltip title="Låst tråd">
                    <Lock className="text-gray-500" fontSize="small" />
                  </Tooltip>
                )}
                
                <Typography 
                  className={cn(
                    'text-h4 font-semibold line-clamp-2',
                    compact && 'text-h5'
                  )}
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  {thread.title}
                </Typography>
              </Stack>
              
              {/* Category and tags */}
              {(showCategory && thread.category) && (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <CategoryBadge 
                    category={thread.category} 
                    size="small"
                    variant="outlined"
                  />
                  
                  {thread.tags && thread.tags.length > 0 && (
                    <>
                      {thread.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            height: '20px',
                            fontSize: '0.7rem',
                            borderRadius: '10px'
                          }}
                        />
                      ))}
                      {thread.tags.length > 3 && (
                        <Typography className="text-caption text-gray-500">
                          +{thread.tags.length - 3} flere
                        </Typography>
                      )}
                    </>
                  )}
                </Stack>
              )}
            </Stack>

            {/* Thread stats */}
            <Stack direction={compact ? 'row' : 'column'} spacing={1} alignItems="center">
              <Tooltip title={`${thread.viewCount} visninger`}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <VisibilityOutlined fontSize="small" className="text-gray-500" />
                  <Typography className="text-caption text-gray-600">
                    {thread.viewCount > 999 ? `${(thread.viewCount / 1000).toFixed(1)}k` : thread.viewCount}
                  </Typography>
                </Stack>
              </Tooltip>
              
              <Tooltip title={`${thread.replyCount} svar`}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <ChatBubbleOutline fontSize="small" className="text-gray-500" />
                  <Typography className="text-caption text-gray-600">
                    {thread.replyCount}
                  </Typography>
                </Stack>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Content preview - only in non-compact mode */}
          {!compact && (
            <Typography 
              className="text-body-sm text-gray-700 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: thread.content.replace(/<[^>]*>/g, '').substring(0, 150) + 
                        (thread.content.length > 150 ? '...' : '')
              }}
            />
          )}
          
          {/* Reactions */}
          {thread.reactions && thread.reactions.length > 0 && (
            <ReactionDisplay 
              reactions={thread.reactions} 
              className="justify-start"
            />
          )}

          {/* Footer with author and last activity */}
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            {/* Original author */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar 
                src={undefined}
                sx={{ width: compact ? 24 : 32, height: compact ? 24 : 32 }}
              >
                {getUserInitials(thread.author)}
              </Avatar>
              
              <Stack spacing={0}>
                <Typography className="text-caption font-medium">
                  {getUserDisplayName(thread.author)}
                </Typography>
                <Typography className="text-caption text-gray-500">
                  {formatTimeAgo(thread.createdAt)}
                </Typography>
              </Stack>
            </Stack>

            {/* Last activity - if different from original */}
            {thread.lastReply && (
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTime fontSize="small" className="text-gray-400" />
                <Stack spacing={0} alignItems="flex-end">
                  <Typography className="text-caption text-gray-600">
                    Sist: {lastActivityUser === thread.author 
                      ? getUserDisplayName(thread.author) 
                      : (thread.lastReply?.author.nickname || 'Ukjent')}
                  </Typography>
                  <Typography className="text-caption text-gray-500">
                    {formatTimeAgo(lastActivityDate)}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Skeleton loader for thread cards
export function ThreadCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <Stack spacing={compact ? 2 : 3}>
          <Stack direction="row" spacing={2}>
            <Stack spacing={1} sx={{ flexGrow: 1 }}>
              <Box 
                sx={{ 
                  bgcolor: 'grey.200', 
                  borderRadius: 1, 
                  height: compact ? 20 : 24,
                  width: '75%'
                }} 
              />
              <Box 
                sx={{ 
                  bgcolor: 'grey.100', 
                  borderRadius: 1, 
                  height: 16,
                  width: '40%'
                }} 
              />
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 16, width: 30 }} />
              <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 16, width: 30 }} />
            </Stack>
          </Stack>
          
          {!compact && (
            <Box 
              sx={{ 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                height: 40,
                width: '100%'
              }} 
            />
          )}
          
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ bgcolor: 'grey.200', borderRadius: '50%', width: 32, height: 32 }} />
              <Stack spacing={0.5}>
                <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 12, width: 80 }} />
                <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 10, width: 60 }} />
              </Stack>
            </Stack>
            
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 12, width: 100 }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}