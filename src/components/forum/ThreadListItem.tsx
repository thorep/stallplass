'use client';

import { 
  Stack, 
  Typography, 
  Avatar, 
  Box,
  Chip,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import { 
  PushPin,
  Lock,
  ThumbUp,
  SentimentSatisfiedAlt,
  Favorite
} from '@mui/icons-material';
import { cn } from '@/lib/utils';
import type { ForumThread } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ThreadListItemProps {
  thread: ForumThread;
  user?: User | null;
  onClick?: () => void;
  className?: string;
}

// Helper to format date/time
function formatDateTime(date: Date): string {
  const now = new Date();
  const threadDate = new Date(date);
  const diff = now.getTime() - threadDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  // Less than 24 hours - show time
  if (hours < 24) {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  }
  
  // Less than 7 days - show day and time
  if (days < 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = dayNames[threadDate.getDay()];
    const time = threadDate.toLocaleTimeString('nb-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${day} at ${time}`;
  }
  
  // Older - show date
  return threadDate.toLocaleDateString('nb-NO', {
    month: 'short',
    day: 'numeric',
    year: threadDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Helper to get user display name
type Author = {
  nickname?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

function getUserDisplayName(author: Author): string {
  if (author.nickname) return author.nickname;
  if (author.firstname || author.lastname) {
    return [author.firstname, author.lastname].filter(Boolean).join(' ');
  }
  return 'Anonym';
}

// Helper to get user initials for avatar
function getUserInitials(author: Author): string {
  const name = getUserDisplayName(author);
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Helper to get reaction icons
function getReactionIcon(type: string) {
  switch(type) {
    case 'like': return <ThumbUp sx={{ fontSize: 14 }} />;
    case 'love': return <Favorite sx={{ fontSize: 14, color: 'red' }} />;
    case 'laugh': return <SentimentSatisfiedAlt sx={{ fontSize: 14, color: 'orange' }} />;
    default: return null;
  }
}

export function ThreadListItem({
  thread,
  user,
  onClick,
  className
}: ThreadListItemProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const lastReplyDate = thread.lastReplyAt || thread.createdAt;
  const lastReplyAuthor = thread.lastReply?.author || thread.author;
  
  // Group reactions by type
  const reactionCounts = thread.reactions?.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  return (
    <Paper
      className={cn(
        'cursor-pointer transition-all duration-200 hover:bg-gray-50',
        thread.isPinned && 'bg-yellow-50',
        className
      )}
      onClick={onClick}
      sx={{ 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'action.hover'
        }
      }}
      elevation={0}
    >
      <Stack direction="row" className="p-3">
        {/* Left side - Avatar */}
        <Box className="mr-3">
          <Avatar 
            src={undefined}
            sx={{ width: 40, height: 40 }}
          >
            {getUserInitials(thread.author)}
          </Avatar>
        </Box>

        {/* Middle - Title and metadata */}
        <Stack spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Title line with indicators */}
          <Stack direction="row" spacing={1} alignItems="center">
            {thread.isPinned && (
              <PushPin sx={{ fontSize: 16, color: 'warning.main' }} />
            )}
            {thread.isLocked && (
              <Lock sx={{ fontSize: 16, color: 'text.disabled' }} />
            )}
            <Typography 
              className="font-semibold"
              sx={{ 
                fontSize: '0.95rem',
                lineHeight: 1.4,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {thread.title}
            </Typography>
          </Stack>

          {/* Author and date line */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              {getUserDisplayName(thread.author)}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
              •
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              {formatDateTime(thread.createdAt)}
            </Typography>
            
            {/* Show page numbers if many replies */}
            {thread.replyCount > 20 && (
              <>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                  •
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  {Array.from({ length: Math.min(5, Math.ceil(thread.replyCount / 20)) }, (_, i) => (
                    <Chip
                      key={i}
                      label={i + 1}
                      size="small"
                      sx={{ 
                        height: 16,
                        fontSize: '0.7rem',
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                      variant={i === 0 ? 'filled' : 'outlined'}
                    />
                  ))}
                  {thread.replyCount > 100 && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      ...
                    </Typography>
                  )}
                </Stack>
              </>
            )}
          </Stack>
        </Stack>

        {/* Right side - Stats and reactions */}
        <Stack direction="row" spacing={3} alignItems="center">
          {/* Reactions */}
          {Object.keys(reactionCounts).length > 0 && !isMobile && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {Object.entries(reactionCounts).slice(0, 3).map(([type, count]) => (
                <Stack key={type} direction="row" spacing={0.5} alignItems="center">
                  {getReactionIcon(type)}
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {count}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {/* Reply count */}
          <Stack alignItems="center" spacing={0}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {thread.replyCount}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Replies
            </Typography>
          </Stack>

          {/* View count */}
          <Stack alignItems="center" spacing={0}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {thread.viewCount > 999 
                ? `${(thread.viewCount / 1000).toFixed(1)}k` 
                : thread.viewCount}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              Views
            </Typography>
          </Stack>

          {/* Last reply info */}
          <Stack alignItems="flex-end" spacing={0} minWidth={isMobile ? 100 : 180}>
            <Typography 
              sx={{ 
                fontSize: '0.8rem', 
                color: 'text.primary',
                fontWeight: 500
              }}
            >
              {formatDateTime(lastReplyDate)}
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '0.75rem', 
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {getUserDisplayName(lastReplyAuthor)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

// Skeleton loader for thread list items
export function ThreadListItemSkeleton() {
  return (
    <Paper
      sx={{ 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
      elevation={0}
    >
      <Stack direction="row" className="p-3">
        <Box className="mr-3">
          <Box sx={{ bgcolor: 'grey.200', borderRadius: '50%', width: 40, height: 40 }} />
        </Box>
        
        <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
          <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 16, width: '60%' }} />
          <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 12, width: '30%' }} />
        </Stack>
        
        <Stack direction="row" spacing={3} alignItems="center">
          <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 30, width: 40 }} />
          <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 30, width: 40 }} />
          <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 30, width: 100 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}