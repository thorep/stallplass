'use client';

import { useState, useEffect } from 'react';
import { 
  Stack, 
  Button, 
  Typography, 
  Avatar,
  Paper,
  Box,
  Alert,
  Collapse
} from '@mui/material';
import { Close, Reply } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { ForumRichTextEditor } from './ForumRichTextEditor';
import { useCreateForumReply } from '@/hooks/useForum';
import type { CreateReplyInput, ForumReply } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ReplyFormProps {
  threadId: string;
  user: User | null;
  quotedPost?: ForumReply | null;
  onClearQuote?: () => void;
  onSuccess?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  showAvatar?: boolean;
}

// Helper to get user display name
function getUserDisplayName(user: User): string {
  // Assuming user has metadata with profile info
  const profile = user.user_metadata || {};
  if (profile.nickname) return profile.nickname;
  if (profile.firstname || profile.lastname) {
    return [profile.firstname, profile.lastname].filter(Boolean).join(' ');
  }
  return user.email?.split('@')[0] || 'Anonym bruker';
}

// Helper to get user initials for avatar
function getUserInitials(user: User): string {
  const name = getUserDisplayName(user);
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function ReplyForm({
  threadId,
  user,
  quotedPost,
  onClearQuote,
  onSuccess,
  className,
  placeholder = 'Skriv ditt svar her...',
  autoFocus = false,
  compact = false,
  showAvatar = true
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(autoFocus);
  const [error, setError] = useState<string | null>(null);
  
  const createReply = useCreateForumReply(threadId);
  const isLoading = createReply.isPending;

  // Handle quoted post changes
  useEffect(() => {
    if (quotedPost && quotedPost.author) {
      setContent(''); // Clear content but show quote box separately
      setIsOpen(true);
    }
  }, [quotedPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Svar kan ikke være tomt');
      return;
    }

    if (content.trim().length < 3) {
      setError('Svaret må være minst 3 tegn');
      return;
    }

    try {
      const replyData: CreateReplyInput = {
        content: content.trim()
      };

      await createReply.mutateAsync(replyData);
      
      setContent('');
      setError(null);
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create reply:', error);
      setError(error instanceof Error ? error.message : 'En feil oppstod');
    }
  };


  const handleOpen = () => {
    setIsOpen(true);
  };

  // Show login prompt if user is not logged in
  if (!user) {
    return (
      <Paper 
        className={cn('p-4', className)}
        sx={{ 
          borderRadius: 2,
          backgroundColor: 'grey.50',
          border: '2px dashed',
          borderColor: 'grey.300',
          textAlign: 'center'
        }}
      >
        <Typography className="text-body text-gray-600 mb-2">
          Du må være logget inn for å svare på denne tråden
        </Typography>
        <Button
          href="/logg-inn"
          variant="contained"
          size="small"
          sx={{ borderRadius: 2 }}
        >
          Logg inn
        </Button>
      </Paper>
    );
  }

  if (!isOpen && !autoFocus) {
    return (
      <Paper 
        className={cn('p-3 cursor-pointer hover:shadow-md transition-shadow', className)}
        onClick={handleOpen}
        sx={{ 
          borderRadius: 2,
          backgroundColor: 'grey.50',
          border: '2px dashed',
          borderColor: 'grey.300',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.light',
            color: 'primary.contrastText'
          }
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {showAvatar && (
            <Avatar 
              src={user.user_metadata?.imageUrl}
              sx={{ width: 32, height: 32 }}
            >
              {getUserInitials(user)}
            </Avatar>
          )}
          
          <Typography className="text-body text-gray-600">
            <Reply fontSize="small" className="mr-2" />
            Klikk for å svare på denne tråden...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box className={className}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>

          {/* Quote Box */}
          {quotedPost && (
            <Box
              sx={{
                backgroundColor: 'grey.50',
                border: 1,
                borderColor: 'grey.200',
                borderRadius: 1,
                p: 2,
                position: 'relative'
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'primary.main', 
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      mb: 0.5 
                    }}
                  >
                    {quotedPost.author.nickname || quotedPost.author.firstname || 'Bruker'} skrev:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: '0.8rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: quotedPost.content.length > 200 
                        ? quotedPost.content.substring(0, 200) + '...'
                        : quotedPost.content
                    }}
                  />
                </Box>
                <Button
                  size="small"
                  onClick={onClearQuote}
                  sx={{ 
                    minWidth: 'auto', 
                    p: 0.5,
                    color: 'text.secondary'
                  }}
                >
                  <Close fontSize="small" />
                </Button>
              </Stack>
            </Box>
          )}

          {/* Content editor */}
          <ForumRichTextEditor
            content={content}
            onChange={setContent}
            placeholder={placeholder}
            minHeight={compact ? 100 : 150}
          />


          {/* Error message */}
          <Collapse in={!!error}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Collapse>

          {/* Action buttons */}
          <Stack 
            direction="row" 
            spacing={1} 
            justifyContent="flex-end"
            alignItems="center"
          >
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !content.trim()}
              sx={{ 
                borderRadius: 1,
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 3
              }}
            >
{isLoading ? 'SENDER...' : 'SEND SVAR'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}

// Quick reply component for inline replies
interface QuickReplyProps {
  threadId: string;
  user: User | null;
  onSuccess?: () => void;
  className?: string;
}

export function QuickReply({
  threadId,
  user,
  onSuccess,
  className
}: QuickReplyProps) {
  return (
    <ReplyForm
      threadId={threadId}
      user={user}
      onSuccess={onSuccess}
      compact
      autoFocus={false}
      placeholder="Skriv et raskt svar..."
      className={className}
    />
  );
}