'use client';

import { useState, useMemo } from 'react';
import { 
  Container,
  Stack,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import { Add, Forum, TrendingUp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ThreadCard, ThreadCardSkeleton } from '@/components/forum/ThreadCard';
import { CategoryFilter } from '@/components/forum/CategoryFilter';
import { useForumThreads, useForumCategories } from '@/hooks/useForum';
import type { User } from '@supabase/supabase-js';

interface ForumMainProps {
  user: User;
}

export function ForumMain({ user }: ForumMainProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Fetch data
  const { data: categories = [], isLoading: categoriesLoading } = useForumCategories();
  const { data: threads = [], isLoading: threadsLoading } = useForumThreads({
    categoryId: selectedCategoryId || undefined,
    limit: 20
  });

  // Stats calculations
  const stats = useMemo(() => {
    const totalThreads = threads.length;
    const totalReplies = threads.reduce((sum, thread) => sum + thread.replyCount, 0);
    const totalReactions = threads.reduce((sum, thread) => sum + (thread.reactions?.length || 0), 0);
    
    return {
      threads: totalThreads,
      replies: totalReplies,
      reactions: totalReactions
    };
  }, [threads]);

  const handleCreateThread = () => {
    router.push('/forum/ny');
  };

  const handleThreadClick = (threadId: string) => {
    router.push(`/forum/${threadId}`);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <Container maxWidth="xl" className="py-6">
      <Stack spacing={4}>
        {/* Header */}
        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          justifyContent="space-between" 
          alignItems={isMobile ? 'stretch' : 'center'} 
          spacing={2}
        >
          <Stack spacing={1}>
            <Typography className="text-h2 font-bold" sx={{ color: 'primary.main' }}>
              <Forum className="mr-2" fontSize="large" />
              Forum
            </Typography>
            <Typography className="text-body text-gray-600">
              Diskuter alt om hester, stell og riding med andre hesteeiere
            </Typography>
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
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper 
              className="p-4 text-center"
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
                Aktive tråder
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper 
              className="p-4 text-center"
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
                Svar totalt
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper 
              className="p-4 text-center"
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
          </Grid>
        </Grid>

        {/* Category Filter */}
        <Paper 
          className="p-4"
          sx={{ borderRadius: 2 }}
        >
          {categoriesLoading ? (
            <Stack direction="row" spacing={2}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} width={120} height={40} sx={{ borderRadius: 3 }} />
              ))}
            </Stack>
          ) : (
            <CategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleCategoryChange}
              variant={isMobile ? 'chips' : 'tabs'}
              showCount
            />
          )}
        </Paper>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Thread List */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              {/* Sort/Filter Controls */}
              <Stack 
                direction="row" 
                justifyContent="between" 
                alignItems="center"
                className="px-2"
              >
                <Typography className="text-body-sm text-gray-600">
                  {selectedCategoryId 
                    ? `Viser tråder i ${categories.find(c => c.id === selectedCategoryId)?.name}`
                    : `Viser alle ${threads.length} tråder`
                  }
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
                    <Forum sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography className="text-h4 text-gray-600 mb-2">
                      {selectedCategoryId ? 'Ingen tråder i denne kategorien' : 'Ingen tråder ennå'}
                    </Typography>
                    <Typography className="text-body-sm text-gray-500 mb-4">
                      {selectedCategoryId 
                        ? 'Vær den første til å starte en diskusjon i denne kategorien!'
                        : 'Vær den første til å starte en diskusjon!'
                      }
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
                      showCategory={!selectedCategoryId}
                      compact={isMobile}
                    />
                  ))
                )}
              </Stack>
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              {/* Popular Categories */}
              <Paper className="p-4" sx={{ borderRadius: 2 }}>
                <Typography className="text-h5 font-semibold mb-3">
                  Populære kategorier
                </Typography>
                
                {categoriesLoading ? (
                  <Stack spacing={1}>
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} height={40} sx={{ borderRadius: 1 }} />
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    {categories
                      .sort((a, b) => (b._count?.posts || 0) - (a._count?.posts || 0))
                      .slice(0, 5)
                      .map((category) => (
                        <Button
                          key={category.id}
                          onClick={() => setSelectedCategoryId(category.id)}
                          variant={selectedCategoryId === category.id ? 'contained' : 'text'}
                          fullWidth
                          sx={{ 
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            borderRadius: 1
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" width="100%">
                            <span>
                              {category.icon || (
                                category.name.toLowerCase().includes('hest') ? '🐴' : '📋'
                              )}
                            </span>
                            <Typography className="text-body-sm flex-grow text-left">
                              {category.name}
                            </Typography>
                            <Typography className="text-caption text-gray-500">
                              {category._count?.posts || 0}
                            </Typography>
                          </Stack>
                        </Button>
                      ))}
                  </Stack>
                )}
              </Paper>

              {/* Forum Guidelines */}
              <Paper className="p-4" sx={{ borderRadius: 2, backgroundColor: 'info.light' }}>
                <Typography className="text-h5 font-semibold mb-2" sx={{ color: 'info.contrastText' }}>
                  Forum regler
                </Typography>
                <Stack spacing={1}>
                  <Typography className="text-caption" sx={{ color: 'info.contrastText' }}>
                    • Vær snill og respektfull mot andre
                  </Typography>
                  <Typography className="text-caption" sx={{ color: 'info.contrastText' }}>
                    • Hold deg til temaet i hver kategori
                  </Typography>
                  <Typography className="text-caption" sx={{ color: 'info.contrastText' }}>
                    • Ikke spam eller reklame
                  </Typography>
                  <Typography className="text-caption" sx={{ color: 'info.contrastText' }}>
                    • Rapporter upassende innhold
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}