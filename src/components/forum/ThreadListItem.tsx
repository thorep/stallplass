'use client';

import { 
  Stack, 
  Typography, 
  Avatar, 
  Box,
  Chip,
  Paper
} from '@mui/material';
import { 
  PushPin,
  Lock,
  ThumbUp,
  SentimentSatisfiedAlt,
  Favorite,
  Visibility,
  Reply,
  TrendingUp
} from '@mui/icons-material';
import { cn } from '@/lib/utils';
import type { ForumThread } from '@/types/forum';
import { useForumView } from '@/hooks/useForumView';

interface ThreadListItemProps {
  thread: ForumThread;
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
    if (minutes < 1) return 'Nå nettopp';
    if (minutes < 60) return `${minutes} min siden`;
    return `${hours} t siden`;
  }
  
  // Less than 7 days - show day and time
  if (days < 7) {
    const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    const day = dayNames[threadDate.getDay()];
    const time = threadDate.toLocaleTimeString('nb-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${day} kl ${time}`;
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

function getUserDisplayName(author: Author | null): string {
  if (!author) return 'Slettet bruker';
  if (author.nickname) return author.nickname;
  if (author.firstname || author.lastname) {
    return [author.firstname, author.lastname].filter(Boolean).join(' ');
  }
  return 'Anonym';
}

// Helper to get user initials for avatar
function getUserInitials(author: Author | null): string {
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
  onClick,
  className
}: ThreadListItemProps) {
  const { dense } = useForumView();
  
  // Group reactions by type
  const reactionCounts = thread.reactions?.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  return (
    <Paper
      className={cn(
        'cursor-pointer transition-all duration-200',
        thread.isPinned && 'bg-yellow-50',
        className
      )}
      onClick={onClick}
      sx={{ 
        borderRadius: dense ? 1 : 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&:hover': {
          backgroundColor: 'grey.50'
        }
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: dense ? 1.25 : 2, p: dense ? 1.25 : 2 }}>
        {/* Avatar */}
        <Avatar 
          src={undefined}
          sx={{ width: dense ? 32 : 40, height: dense ? 32 : 40, bgcolor: 'grey.400' }}
        >
          {getUserInitials(thread.author)}
        </Avatar>

        {/* Content - Title and metadata */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography 
              sx={{ 
                fontSize: dense ? '0.95rem' : '1rem',
                fontWeight: 500,
                color: 'text.primary',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {thread.title}
            </Typography>
            
            {/* Status indicators */}
            {thread.isPinned && (
              <PushPin sx={{ fontSize: 16, color: 'warning.main' }} />
            )}
            {thread.isLocked && (
              <Lock sx={{ fontSize: 16, color: 'error.main' }} />
            )}
          </Stack>

          {/* Enhanced metadata row */}
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              {getUserDisplayName(thread.author)}
            </Typography>
            
            {/* Metadata compact or chips */}
            {dense ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Reply sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.8rem' }}>{thread.replyCount.toLocaleString('nb-NO')}</Typography>
                </Box>
                {thread.viewCount !== undefined && thread.viewCount > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: '0.8rem' }}>{thread.viewCount.toLocaleString('nb-NO')}</Typography>
                  </Box>
                )}
                {(thread.replyCount > 10 || (thread.reactions && thread.reactions.length > 5)) && (
                  <TrendingUp sx={{ fontSize: 16, color: 'warning.main' }} />
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<Reply sx={{ fontSize: 14 }} />}
                  label={thread.replyCount.toLocaleString('nb-NO')}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    height: 20, 
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': { ml: 0.5 }
                  }}
                />
                
                {thread.viewCount !== undefined && thread.viewCount > 0 && (
                  <Chip
                    icon={<Visibility sx={{ fontSize: 14 }} />}
                    label={thread.viewCount.toLocaleString('nb-NO')}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      height: 20, 
                      fontSize: '0.75rem',
                      '& .MuiChip-icon': { ml: 0.5 }
                    }}
                  />
                )}

                {(thread.replyCount > 10 || (thread.reactions && thread.reactions.length > 5)) && (
                  <TrendingUp sx={{ fontSize: 16, color: 'warning.main' }} />
                )}
              </Box>
            )}

            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              {formatDateTime(thread.createdAt)}
            </Typography>
          </Stack>
        </Box>

        {/* Enhanced Reactions */}
        {Object.keys(reactionCounts).length > 0 && !dense && (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mr: 1 }}>
            {Object.entries(reactionCounts).map(([type, count]) => (
              <Box
                key={type}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 3,
                  backgroundColor: 'action.hover',
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                {getReactionIcon(type)}
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {count}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
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
