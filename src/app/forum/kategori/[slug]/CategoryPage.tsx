'use client';

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
  Skeleton,
  CircularProgress,
  Menu,
  MenuItem
} from '@mui/material';
import { Add, ArrowBack, Category, TrendingUp, AccessTime, ArrowDropDown } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ThreadListItem, ThreadListItemSkeleton } from '@/components/forum/ThreadListItem';
import { useForumThreads, useForumCategory } from '@/hooks/useForum';
import type { User } from '@supabase/supabase-js';

interface CategoryPageProps {
  categorySlug: string;
  user: User | null;
}

export function CategoryPage({ categorySlug, user }: CategoryPageProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'latest'>('popular');
  
  // Fetch data
  const { data: category, isLoading: categoryLoading, error: categoryError } = useForumCategory(categorySlug);
  const { data: threads = [], isLoading: threadsLoading } = useForumThreads({
    categoryId: category?.id,
    limit: 20,
    orderBy: sortBy
  });


  const handleBack = () => {
    router.push('/forum');
  };

  const handleCreateThread = () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push(`/logg-inn?redirect=/forum/ny?category=${categorySlug}`);
      return;
    }
    setIsCreatingThread(true);
    router.push(`/forum/ny?category=${categorySlug}`);
  };

  const handleThreadClick = (threadId: string) => {
    router.push(`/forum/${threadId}`);
  };

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortChange = (sort: 'popular' | 'latest') => {
    setSortBy(sort);
    handleSortMenuClose();
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
            <ThreadListItemSkeleton key={i} />
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
            
          </Stack>
          
          <button
            onClick={handleCreateThread}
            disabled={isCreatingThread}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              isCreatingThread 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
            title={!user ? 'Logg inn for å opprette en ny tråd' : undefined}
          >
            {isCreatingThread ? (
              <>
                <CircularProgress size={20} className="text-white" />
                <span>Laster...</span>
              </>
            ) : (
              <>
                <Add />
                <span>Ny tråd</span>
              </>
            )}
          </button>
        </Stack>


        {/* Thread List */}
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
              onClick={handleSortMenuOpen}
              startIcon={sortBy === 'popular' ? <TrendingUp /> : <AccessTime />}
              endIcon={<ArrowDropDown />}
              variant="outlined"
              size="small"
              className="text-gray-600 border-gray-300"
            >
              {sortBy === 'popular' ? 'Populære først' : 'Nyeste først'}
            </Button>
            
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem 
                onClick={() => handleSortChange('popular')}
                selected={sortBy === 'popular'}
              >
                <TrendingUp className="mr-2" fontSize="small" />
                Populære først
              </MenuItem>
              <MenuItem 
                onClick={() => handleSortChange('latest')}
                selected={sortBy === 'latest'}
              >
                <AccessTime className="mr-2" fontSize="small" />
                Nyeste først
              </MenuItem>
            </Menu>
          </Stack>

          {/* Thread List */}
          <Stack spacing={2}>
            {threadsLoading ? (
              // Loading skeletons
              [...Array(5)].map((_, i) => (
                <ThreadListItemSkeleton key={i} />
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
                  {user 
                    ? `Vær den første til å starte en diskusjon i ${category.name}!`
                    : `Logg inn for å starte en diskusjon i ${category.name}!`
                  }
                </Typography>
                <Button
                  onClick={handleCreateThread}
                  variant="contained"
                  disabled={isCreatingThread}
                  startIcon={isCreatingThread ? <CircularProgress size={20} /> : <Add />}
                  sx={{ borderRadius: 2 }}
                  title={!user ? 'Logg inn for å opprette en ny tråd' : undefined}
                >
                  {isCreatingThread ? 'Laster...' : (user ? 'Opprett første tråd' : 'Logg inn for å opprette tråd')}
                </Button>
              </Paper>
            ) : (
              // Thread list items
              threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  onClick={() => handleThreadClick(thread.id)}
                />
              ))
            )}
          </Stack>
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