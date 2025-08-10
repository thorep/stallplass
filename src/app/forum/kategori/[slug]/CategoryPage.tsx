'use client';

import { useMemo } from 'react';
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
  Skeleton
} from '@mui/material';
import { Add, ArrowBack, Category, TrendingUp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ThreadCard, ThreadCardSkeleton } from '@/components/forum/ThreadCard';
import { CategoryBadge } from '@/components/forum/CategoryBadge';
import { useForumThreads, useForumCategory, useForumCategories } from '@/hooks/useForum';
import type { User } from '@supabase/supabase-js';

interface CategoryPageProps {
  categorySlug: string;
  user: User;
}

export function CategoryPage({ categorySlug, user }: CategoryPageProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Fetch data
  const { data: category, isLoading: categoryLoading, error: categoryError } = useForumCategory(categorySlug);
  const { data: allCategories = [] } = useForumCategories();
  const { data: threads = [], isLoading: threadsLoading } = useForumThreads({
    categoryId: category?.id,
    limit: 20
  });

  // Stats calculations
  const stats = useMemo(() => {
    if (!category) return { threads: 0, replies: 0, reactions: 0 };
    
    const totalThreads = threads.length;
    const totalReplies = threads.reduce((sum, thread) => sum + thread.replyCount, 0);
    const totalReactions = threads.reduce((sum, thread) => sum + (thread.reactions?.length || 0), 0);
    
    return {
      threads: totalThreads,
      replies: totalReplies,
      reactions: totalReactions
    };
  }, [threads, category]);

  const handleBack = () => {
    router.push('/forum');
  };

  const handleCreateThread = () => {
    router.push('/forum/ny');
  };

  const handleThreadClick = (threadId: string) => {
    router.push(`/forum/${threadId}`);
  };

  if (categoryLoading) {
    return (
      <Container maxWidth="xl" className="py-6">
        <Stack spacing={4}>
          {/* Loading breadcrumbs */}
          <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: 300 }} />
          
          {/* Loading header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={1}>
              <Skeleton width={200} height={40} />
              <Skeleton width={300} height={20} />
            </Stack>
            <Skeleton width={120} height={40} />
          </Stack>
          
          {/* Loading stats */}
          <Stack direction="row" spacing={2}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} width={150} height={80} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
          
          {/* Loading threads */}
          {[...Array(5)].map((_, i) => (
            <ThreadCardSkeleton key={i} />
          ))}
        </Stack>
      </Container>
    );
  }

  if (categoryError || !category) {
    return (
      <Container maxWidth="lg" className="py-6">
        <Stack spacing={4} alignItems="center">
          <Alert severity="error" sx={{ width: '100%' }}>
            {categoryError instanceof Error ? categoryError.message : 'Kunne ikke finne kategorien'}
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

  return (
    <Container maxWidth="xl" className="py-6">
      <Stack spacing={4}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator="›">
          <Link 
            onClick={handleBack}
            className="cursor-pointer text-primary hover:underline"
          >
            Forum
          </Link>
          <Typography className="text-gray-600">
            {category.name}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          justifyContent="space-between" 
          alignItems={isMobile ? 'stretch' : 'center'} 
          spacing={2}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Category className="text-primary" fontSize="large" />
              <Typography className="text-h2 font-bold" sx={{ color: 'primary.main' }}>
                {category.name}
              </Typography>
            </Stack>
            
            {category.description && (
              <Typography className="text-body text-gray-600">
                {category.description}
              </Typography>
            )}
            
            <CategoryBadge category={category} size="medium" />
          </Stack>
          
          <Button
            onClick={handleCreateThread}
            variant="contained"
            startIcon={<Add />}
            size={isMobile ? 'medium' : 'large'}
            sx={{ 
              borderRadius: 3,
              textTransform: 'none',
              minWidth: isMobile ? 'auto' : 180
            }}
          >
            Ny tråd
          </Button>
        </Stack>

        {/* Stats */}
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
          <Paper 
            className="p-4 text-center flex-1"
            sx={{ 
              borderRadius: 2, 
              backgroundColor: 'primary.light',
              color: 'primary.contrastText'
            }}
          >
            <Typography className="text-h3 font-bold">
              {threadsLoading ? <Skeleton width={60} /> : stats.threads}
            </Typography>
            <Typography className="text-body-sm">
              Tråder
            </Typography>
          </Paper>
          
          <Paper 
            className="p-4 text-center flex-1"
            sx={{ 
              borderRadius: 2, 
              backgroundColor: 'success.light',
              color: 'success.contrastText'
            }}
          >
            <Typography className="text-h3 font-bold">
              {threadsLoading ? <Skeleton width={60} /> : stats.replies}
            </Typography>
            <Typography className="text-body-sm">
              Svar
            </Typography>
          </Paper>
          
          <Paper 
            className="p-4 text-center flex-1"
            sx={{ 
              borderRadius: 2, 
              backgroundColor: 'warning.light',
              color: 'warning.contrastText'
            }}
          >
            <Typography className="text-h3 font-bold">
              {threadsLoading ? <Skeleton width={60} /> : stats.reactions}
            </Typography>
            <Typography className="text-body-sm">
              Reaksjoner
            </Typography>
          </Paper>
        </Stack>

        {/* Content */}
        <Stack direction={isMobile ? 'column' : 'row'} spacing={3}>
          {/* Thread List */}
          <Box sx={{ flexGrow: 1 }}>
            <Stack spacing={3}>
              {/* Controls */}
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                className="px-2"
              >
                <Typography className="text-body-sm text-gray-600">
                  Viser {threads.length} tråder i {category.name}
                </Typography>
                
                <Button
                  startIcon={<TrendingUp />}
                  variant="text"
                  size="small"
                  className="text-gray-600"
                >
                  Populære først
                </Button>
              </Stack>

              {/* Thread List */}
              <Stack spacing={2}>
                {threadsLoading ? (
                  // Loading skeletons
                  [...Array(5)].map((_, i) => (
                    <ThreadCardSkeleton key={i} />
                  ))
                ) : threads.length === 0 ? (
                  // Empty state
                  <Paper 
                    className="p-8 text-center"
                    sx={{ borderRadius: 2, backgroundColor: 'grey.50' }}
                  >
                    <Category sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography className="text-h4 text-gray-600 mb-2">
                      Ingen tråder i denne kategorien ennå
                    </Typography>
                    <Typography className="text-body-sm text-gray-500 mb-4">
                      Vær den første til å starte en diskusjon i {category.name}!
                    </Typography>
                    <Button
                      onClick={handleCreateThread}
                      variant="contained"
                      startIcon={<Add />}
                      sx={{ borderRadius: 2 }}
                    >
                      Opprett første tråd
                    </Button>
                  </Paper>
                ) : (
                  // Thread cards
                  threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      user={user}
                      onClick={() => handleThreadClick(thread.id)}
                      showCategory={false} // Don't show category since we're already filtering by it
                      compact={isMobile}
                    />
                  ))
                )}
              </Stack>
            </Stack>
          </Box>

          {/* Sidebar - only show on desktop */}
          {!isMobile && (
            <Box sx={{ width: 300 }}>
              <Stack spacing={3}>
                {/* Category Info */}
                <Paper className="p-4" sx={{ borderRadius: 2 }}>
                  <Typography className="text-h5 font-semibold mb-3">
                    Om denne kategorien
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Typography className="text-body-sm text-gray-700">
                      {category.description || 'Diskuter alle temaer relatert til ' + category.name.toLowerCase() + '.'}
                    </Typography>
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography className="text-caption text-gray-500">
                        Totalt innlegg:
                      </Typography>
                      <Typography className="text-caption font-medium">
                        {category._count?.posts || 0}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Other Categories */}
                <Paper className="p-4" sx={{ borderRadius: 2 }}>
                  <Typography className="text-h5 font-semibold mb-3">
                    Andre kategorier
                  </Typography>
                  
                  <Stack spacing={1}>
                    {allCategories
                      .filter(cat => cat.id !== category.id)
                      .slice(0, 5)
                      .map((otherCategory) => (
                        <Button
                          key={otherCategory.id}
                          onClick={() => router.push(`/forum/kategori/${otherCategory.slug}`)}
                          variant="text"
                          fullWidth
                          sx={{ 
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            borderRadius: 1
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" width="100%">
                            <span>
                              {otherCategory.icon || '📋'}
                            </span>
                            <Typography className="text-body-sm flex-grow text-left">
                              {otherCategory.name}
                            </Typography>
                            <Typography className="text-caption text-gray-500">
                              {otherCategory._count?.posts || 0}
                            </Typography>
                          </Stack>
                        </Button>
                      ))}
                    
                    <Button
                      onClick={handleBack}
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      Se alle kategorier
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Box>
          )}
        </Stack>

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