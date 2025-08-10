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
  user: User;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
}

// Reaction types with emojis
const REACTION_TYPES = {
  like: { emoji: '👍', label: 'Liker' },
  love: { emoji: '❤️', label: 'Elsker' },
  laugh: { emoji: '😊', label: 'Morsom' },
  sad: { emoji: '😢', label: 'Trist' },
  angry: { emoji: '😡', label: 'Sint' },
  helpful: { emoji: '💡', label: 'Nyttig' }
} as const;

type ReactionType = keyof typeof REACTION_TYPES;

// Helper to summarize reactions by type
function summarizeReactions(reactions: ForumReaction[], userId: string): ForumReactionSummary[] {
  const summary = new Map<string, { count: number; userReacted: boolean }>();
  
  reactions.forEach((reaction) => {
    const current = summary.get(reaction.type) || { count: 0, userReacted: false };
    current.count++;
    if (reaction.userId === userId) {
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
  
  const reactionSummary = summarizeReactions(reactions, user.id);
  
  const handleReactionClick = async (reactionType: ReactionType) => {
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
            border: 'none',
            borderRadius: '1.5rem',
            px: 1.5,
            py: 0.5,
            minWidth: 'auto',
            '&.Mui-selected': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.main'
              }
            },
            '&:hover': {
              backgroundColor: 'grey.100'
            }
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
                      className={cn(
                        'text-caption font-medium',
                        userReacted ? 'text-primary-contrastText' : 'text-gray-600'
                      )}
                      sx={{ minWidth: '1rem', textAlign: 'center' }}
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
        <Typography className="text-caption text-gray-500 ml-2">
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
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full"
          >
            <span className="text-xs">{config.emoji}</span>
            <Typography className="text-caption font-medium text-gray-700">
              {count}
            </Typography>
          </div>
        );
      })}
      
      {showTotal && (
        <Typography className="text-caption text-gray-500">
          {reactions.length} total
        </Typography>
      )}
    </Stack>
  );
}