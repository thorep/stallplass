'use client';

import { useState, useEffect } from 'react';
import { 
  Container,
  Stack,
  Typography,
  Button,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  Alert,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { 
  ArrowBack, 
  Reply as ReplyIcon,
  Share
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { PostCard, PostCardSkeleton } from '@/components/forum/PostCard';
import { ReplyForm, FloatingReplyButton } from '@/components/forum/ReplyForm';
import { CategoryBadge } from '@/components/forum/CategoryBadge';
import { useForumThread } from '@/hooks/useForum';
import type { User } from '@supabase/supabase-js';
import type { ForumThreadWithReplies, ForumReply } from '@/types/forum';

interface ThreadViewProps {
  threadId: string;
  user: User | null;
}

export function ThreadView({ threadId, user }: ThreadViewProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [quotedPost, setQuotedPost] = useState<ForumReply | null>(null);
  
  // Fetch thread data
  const { 
    data: thread, 
    isLoading, 
    error,
    refetch 
  } = useForumThread(threadId);

  // Increment view count when thread loads
  useEffect(() => {
    if (thread) {
      // TODO: Implement view count increment API call
      console.log('Incrementing view count for thread:', threadId);
    }
  }, [thread, threadId]);

  const handleBack = () => {
    router.back();
  };

  const handleReplySuccess = () => {
    setQuotedPost(null); // Clear quote after successful reply
    refetch(); // Refresh thread data to show new reply
  };

  const handleReplyToPost = (post: ForumReply) => {
    setQuotedPost(post);
    // Scroll to reply form
    const replyForm = document.querySelector('[data-reply-form]');
    if (replyForm) {
      replyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEditPost = (postId: string) => {
    // TODO: Implement edit functionality
    console.log('Edit post:', postId);
  };

  const handleShare = async () => {
    if (navigator.share && thread) {
      try {
        await navigator.share({
          title: thread.title,
          text: `Les denne tråden på Stallplass Forum`,
          url: window.location.href,
        });
      } catch {
        // Fall back to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fall back to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" className="py-6">
        <Stack spacing={4}>
          {/* Loading breadcrumbs */}
          <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: 300 }} />
          
          {/* Loading thread */}
          <PostCardSkeleton />
          
          {/* Loading replies */}
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </Stack>
      </Container>
    );
  }

  if (error || !thread) {
    return (
      <Container maxWidth="lg" className="py-6">
        <Stack spacing={4} alignItems="center">
          <Alert severity="error" sx={{ width: '100%' }}>
            {error instanceof Error ? error.message : 'Kunne ikke laste tråden'}
          </Alert>
          
          <Button
            onClick={handleBack}
            startIcon={<ArrowBack />}
            variant="outlined"
          >
            Tilbake til forum
          </Button>
        </Stack>
      </Container>
    );
  }

  const typedThread = thread as ForumThreadWithReplies;

  return (
    <Container maxWidth="lg" className="py-6">
      <Stack spacing={4}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator="›">
          <Link 
            onClick={handleBack}
            className="cursor-pointer text-primary hover:underline"
          >
            Forum
          </Link>
          {typedThread.category && (
            <Link 
              onClick={() => router.push(`/forum/kategori/${typedThread.category?.slug}`)}
              className="cursor-pointer text-primary hover:underline"
            >
              {typedThread.category.name}
            </Link>
          )}
          <Typography className="text-gray-600 line-clamp-1">
            {typedThread.title}
          </Typography>
        </Breadcrumbs>

        {/* Thread Header */}
        <Paper className="p-4" sx={{ borderRadius: 2 }}>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack spacing={2} sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography className="text-h3 font-bold">
                  {typedThread.title}
                </Typography>
                
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  {typedThread.category && (
                    <CategoryBadge category={typedThread.category} />
                  )}
                  
                  <Typography className="text-caption text-gray-500">
                    {typedThread.viewCount} visninger • {typedThread.replyCount} svar
                  </Typography>
                </Stack>
              </Stack>

              {/* Action buttons */}
              <Stack direction="row" spacing={1}>
                <Button
                  onClick={handleShare}
                  variant="outlined"
                  size="small"
                  startIcon={<Share />}
                  sx={{ borderRadius: 2 }}
                >
                  Del
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {/* Thread Content */}
        <PostCard
          post={typedThread}
          user={user}
          isThread
          onEdit={() => handleEditPost(typedThread.id)}
          showReplyButton={false}
        />

        {/* Divider */}
        {typedThread.replies && typedThread.replies.length > 0 && (
          <Divider>
            <Typography className="text-body-sm text-gray-600 bg-white px-4">
              {typedThread.replies.length} svar
            </Typography>
          </Divider>
        )}

        {/* Replies */}
        {typedThread.replies?.map((reply) => (
          <PostCard
            key={reply.id}
            post={reply}
            user={user}
            onEdit={() => handleEditPost(reply.id)}
            onReply={() => handleReplyToPost(reply)}
            level={0} // Could implement nested replies in the future
          />
        ))}

        {/* Empty state for no replies */}
        {(!typedThread.replies || typedThread.replies.length === 0) && (
          <Paper 
            className="p-8 text-center"
            sx={{ borderRadius: 2, backgroundColor: 'grey.50' }}
          >
            <ReplyIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography className="text-h4 text-gray-600 mb-2">
              Ingen svar ennå
            </Typography>
            <Typography className="text-body-sm text-gray-500 mb-4">
              Vær den første til å svare på denne tråden!
            </Typography>
          </Paper>
        )}

        {/* Permanent Reply Form - Always visible */}
        <div data-reply-form>
          <ReplyForm
            threadId={threadId}
            user={user}
            quotedPost={quotedPost}
            onClearQuote={() => setQuotedPost(null)}
            onSuccess={handleReplySuccess}
            onCancel={null} // No cancel needed since it's always visible
            autoFocus={true}
          />
        </div>

        {/* Back to forum button */}
        <Stack direction="row" justifyContent="center">
          <Button
            onClick={handleBack}
            startIcon={<ArrowBack />}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Tilbake til forum
          </Button>
        </Stack>
      </Stack>

    </Container>
  );
}