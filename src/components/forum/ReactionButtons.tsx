'use client';

import { useState } from 'react';
import { 
  ToggleButtonGroup, 
  ToggleButton, 
  Typography, 
  Stack,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { cn } from '@/lib/utils';
import { useAddForumReaction, useRemoveForumReaction } from '@/hooks/useForum';
import type { ForumReaction, ForumReactionSummary } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ReactionButtonsProps {
  postId: string;
  reactions: ForumReaction[];
  user: User | null;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
}

// Reaction types with emojis and colors
const REACTION_TYPES = {
  like: { emoji: '👍', label: 'Liker', color: 'primary' },
  love: { emoji: '❤️', label: 'Elsker', color: 'error' },
  laugh: { emoji: '😊', label: 'Morsom', color: 'warning' },
  sad: { emoji: '😢', label: 'Trist', color: 'info' },
  angry: { emoji: '😡', label: 'Sint', color: 'error' },
  helpful: { emoji: '💡', label: 'Nyttig', color: 'success' }
} as const;

type ReactionType = keyof typeof REACTION_TYPES;

// Helper to summarize reactions by type
function summarizeReactions(reactions: ForumReaction[], userId: string | null): ForumReactionSummary[] {
  const summary = new Map<string, { count: number; userReacted: boolean }>();
  
  reactions.forEach((reaction) => {
    const current = summary.get(reaction.type) || { count: 0, userReacted: false };
    current.count++;
    if (userId && reaction.userId === userId) {
      current.userReacted = true;
    }
    summary.set(reaction.type, current);
  });
  
  return Array.from(summary.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    userReacted: data.userReacted
  }));
}

export function ReactionButtons({
  postId,
  reactions,
  user,
  className,
  size = 'small',
  orientation = 'horizontal'
}: ReactionButtonsProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const addReaction = useAddForumReaction();
  const removeReaction = useRemoveForumReaction();
  
  const reactionSummary = summarizeReactions(reactions, user?.id || null);
  
  const handleReactionClick = async (reactionType: ReactionType) => {
    if (!user) {
      // Redirect to login with current URL as return URL
      const currentUrl = window.location.pathname;
      window.location.href = `/logg-inn?returnUrl=${encodeURIComponent(currentUrl)}`;
      return;
    }
    
    if (isUpdating) return;
    
    setIsUpdating(reactionType);
    
    try {
      const existingReaction = reactionSummary.find(r => r.type === reactionType);
      
      if (existingReaction?.userReacted) {
        // Remove reaction
        await removeReaction.mutateAsync({ postId, type: reactionType });
      } else {
        // Add reaction
        await addReaction.mutateAsync({ postId, type: reactionType });
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const getUserReactedTypes = () => {
    return reactionSummary
      .filter(r => r.userReacted)
      .map(r => r.type);
  };

  return (
    <Stack 
      direction={orientation === 'horizontal' ? 'row' : 'column'} 
      spacing={0.5}
      className={cn('flex-wrap', className)}
    >
      <ToggleButtonGroup
        value={getUserReactedTypes()}
        size={size}
        orientation={orientation}
        sx={{ 
          '& .MuiToggleButton-root': { 
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: '1.5rem',
            px: 1.5,
            py: 0.5,
            minWidth: 'auto',
            backgroundColor: 'background.paper',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              borderColor: 'primary.main',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            },
            '&:hover': {
              backgroundColor: 'grey.50',
              borderColor: 'grey.400',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            },
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        {Object.entries(REACTION_TYPES).map(([type, config]) => {
          const reactionType = type as ReactionType;
          const summary = reactionSummary.find(r => r.type === reactionType);
          const count = summary?.count || 0;
          const userReacted = summary?.userReacted || false;
          const isLoading = isUpdating === reactionType;
          
          return (
            <Tooltip key={reactionType} title={config.label} placement="top">
              <ToggleButton
                value={reactionType}
                onClick={() => handleReactionClick(reactionType)}
                disabled={isLoading}
                className={cn(
                  'transition-all duration-200',
                  userReacted && 'shadow-sm',
                  count > 0 && 'border border-gray-200'
                )}
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {isLoading ? (
                    <CircularProgress size={14} />
                  ) : (
                    <span className="text-sm">{config.emoji}</span>
                  )}
                  
                  {count > 0 && (
                    <Typography 
                      className="text-caption font-bold"
                      sx={{ 
                        minWidth: '1rem', 
                        textAlign: 'center',
                        color: userReacted ? 'white' : 'text.primary'
                      }}
                    >
                      {count}
                    </Typography>
                  )}
                </Stack>
              </ToggleButton>
            </Tooltip>
          );
        })}
      </ToggleButtonGroup>
      
      {/* Total reactions count - only show if there are reactions */}
      {reactions.length > 0 && (
        <Typography 
          className="text-caption ml-2"
          sx={{ color: 'text.secondary', fontWeight: 500 }}
        >
          {reactions.length} reaksjon{reactions.length !== 1 ? 'er' : ''}
        </Typography>
      )}
    </Stack>
  );
}

// Simplified version for display-only (no interaction)
interface ReactionDisplayProps {
  reactions: ForumReaction[];
  className?: string;
  showTotal?: boolean;
}

export function ReactionDisplay({ 
  reactions, 
  className,
  showTotal = false 
}: ReactionDisplayProps) {
  if (reactions.length === 0) return null;
  
  // Group reactions by type for display
  const grouped = reactions.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <Stack 
      direction="row" 
      spacing={1} 
      alignItems="center" 
      className={cn('flex-wrap', className)}
    >
      {Object.entries(grouped).map(([type, count]) => {
        const config = REACTION_TYPES[type as ReactionType];
        if (!config) return null;
        
        return (
          <div
            key={type}
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--mui-palette-grey-100)',
              border: '1px solid var(--mui-palette-grey-300)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            <span className="text-sm">{config.emoji}</span>
            <Typography 
              className="text-caption font-bold"
              sx={{ color: 'text.primary' }}
            >
              {count}
            </Typography>
          </div>
        );
      })}
      
      {showTotal && (
        <Typography 
          className="text-caption"
          sx={{ color: 'text.secondary', fontWeight: 500 }}
        >
          {reactions.length} total
        </Typography>
      )}
    </Stack>
  );
}