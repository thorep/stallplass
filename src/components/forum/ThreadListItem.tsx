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
        'cursor-pointer transition-all duration-200',
        thread.isPinned && 'bg-yellow-50',
        className
      )}
      onClick={onClick}
      sx={{ 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&:hover': {
          backgroundColor: 'grey.50'
        }
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        {/* Avatar */}
        <Avatar 
          src={undefined}
          sx={{ width: 40, height: 40, bgcolor: 'grey.400' }}
        >
          {getUserInitials(thread.author)}
        </Avatar>

        {/* Content - Title and metadata inline */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            sx={{ 
              fontSize: '1rem',
              fontWeight: 500,
              color: 'text.primary',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {thread.title}
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
            {getUserDisplayName(thread.author)}
            <span style={{ margin: '0 4px' }}>•</span>
            Svar: {thread.replyCount.toLocaleString('nb-NO')}
            <span style={{ margin: '0 4px' }}>•</span>
            {formatDateTime(thread.createdAt)}
          </Typography>
        </Box>

        {/* Reactions */}
        {Object.keys(reactionCounts).length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
            {getReactionIcon('like')}
            {getReactionIcon('laugh')} 
            {getReactionIcon('love')}
          </Box>
        )}

        {/* Footer pin icon if needed */}
        {thread.isPinned && (
          <PushPin sx={{ fontSize: 20, color: 'warning.main', mr: 1 }} />
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