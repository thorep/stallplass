'use client';

import { 
  Container,
  Stack,
  Typography,
  Button,
  Box,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
  Alert,
  useTheme,
  useMediaQuery,
  Skeleton,
  CircularProgress,
  Menu,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { Add, ArrowBack, Category, TrendingUp, AccessTime, ArrowDropDown } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ThreadListItem, ThreadListItemSkeleton } from '@/components/forum/ThreadListItem';
import { useForumThreads, useForumCategory, useRecentActivity } from '@/hooks/useForum';
import type { User } from '@supabase/supabase-js';
import { useForumView } from '@/hooks/useForumView';

interface CategoryPageProps {
  categorySlug: string;
  user: User | null;
}

export function CategoryPage({ categorySlug, user }: CategoryPageProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { dense, setDense } = useForumView();
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
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity({ 
    limit: 10,
    categoryId: category?.id 
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
      <Box sx={{ backgroundColor: 'grey.100', minHeight: '100vh', py: { xs: 0, sm: 1 } }}>
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
      </Box>
    );
  }

  if (categoryError || !category) {
    return (
      <Box sx={{ backgroundColor: 'grey.100', minHeight: '100vh', py: { xs: 0, sm: 1 } }}>
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
      </Box>
    );
  }

  return (
    <Box sx={{ 
      backgroundColor: 'grey.100',
      minHeight: '100vh',
      py: { xs: 0, sm: 1 }
    }}>
      <Container maxWidth="xl" className="py-6">
        <Stack spacing={dense ? 3 : 4}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator="›">
          <MuiLink 
            onClick={handleBack}
            sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          >
            Forum
          </MuiLink>
          <Typography sx={{ color: 'text.secondary' }}>
            {category.name}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: dense ? 0.75 : 1, 
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'primary.50',
            p: dense ? 2 : 3
          }}
        >
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            justifyContent="space-between" 
            alignItems={isMobile ? 'stretch' : 'center'} 
            spacing={dense ? 1.5 : 2}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Category sx={{ color: 'primary.main' }} fontSize="large" />
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  {category.name}
                </Typography>
              </Stack>
              
              {category.description && (
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {category.description}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControlLabel
                control={<Switch size="small" checked={dense} onChange={(_, v) => setDense(v)} />}
                label={<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Kompakt visning</Typography>}
              />
            <Button
              onClick={handleCreateThread}
              disabled={isCreatingThread}
              variant="contained"
              startIcon={isCreatingThread ? <CircularProgress size={20} color="inherit" /> : <Add />}
              sx={{ borderRadius: 2, minWidth: 120 }}
              title={!user ? 'Logg inn for å opprette en ny tråd' : undefined}
            >
              {isCreatingThread ? 'Laster...' : 'Ny tråd'}
            </Button>
            </Stack>
          </Stack>
        </Paper>


          {/* Main Layout with Sidebar */}
          <Grid container spacing={dense ? 2 : 3}>
            {/* Main Content */}
            <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 2, lg: 1 } }}>
              <Stack spacing={dense ? 2 : 3}>
                {/* Controls */}
                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center"
                  sx={{ px: 1 }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Viser {threads.length} tråder i {category.name}
                  </Typography>
                
                  <Button
                    onClick={handleSortMenuOpen}
                    startIcon={sortBy === 'popular' ? <TrendingUp /> : <AccessTime />}
                    endIcon={<ArrowDropDown />}
                    variant="outlined"
                    size="small"
                    sx={{ color: 'text.secondary', borderColor: 'divider' }}
                  >
                    {sortBy === 'popular' ? 'Populære først' : 'Nyeste først'}
                  </Button>
            
                </Stack>
                
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
                    <TrendingUp sx={{ mr: 1 }} fontSize="small" />
                    Populære først
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('latest')}
                    selected={sortBy === 'latest'}
                  >
                    <AccessTime sx={{ mr: 1 }} fontSize="small" />
                    Nyeste først
                  </MenuItem>
                </Menu>

                {/* Thread List */}
                {threadsLoading ? (
                  <Stack spacing={dense ? 1.5 : 2}>
                    {[...Array(5)].map((_, i) => (
                      <ThreadListItemSkeleton key={i} />
                    ))}
                  </Stack>
                ) : threads.length === 0 ? (
                  <Paper 
                    sx={{ 
                      p: dense ? 3 : 4, 
                      textAlign: 'center',
                      borderRadius: 2, 
                      backgroundColor: 'grey.50' 
                    }}
                  >
                    <Category sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h5" sx={{ color: 'text.secondary', mb: 2 }}>
                      Ingen tråder i denne kategorien ennå
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      {user 
                        ? `Vær den første til å starte en diskusjon i ${category.name}!`
                        : `Logg inn for å starte en diskusjon i ${category.name}!`
                      }
                    </Typography>
                    <Button
                      onClick={handleCreateThread}
                      variant="contained"
                      disabled={isCreatingThread}
                      startIcon={isCreatingThread ? <CircularProgress size={20} color="inherit" /> : <Add />}
                      sx={{ borderRadius: 2 }}
                      title={!user ? 'Logg inn for å opprette en ny tråd' : undefined}
                    >
                      {isCreatingThread ? 'Laster...' : (user ? 'Opprett første tråd' : 'Logg inn for å opprette tråd')}
                    </Button>
                  </Paper>
                ) : dense ? (
                  // Compact table view
                  <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tittel</TableCell>
                          <TableCell align="right">Svar</TableCell>
                          <TableCell align="right">Visninger</TableCell>
                          <TableCell align="right">Siste</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {threads.map((thread) => (
                          <TableRow key={thread.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleThreadClick(thread.id)}>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                {thread.isPinned && <TrendingUp sx={{ fontSize: 16, color: 'warning.main' }} />}
                                <Typography noWrap sx={{ fontSize: '0.95rem' }}>{thread.title}</Typography>
                              </Stack>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {thread.author?.nickname || thread.author?.firstname || 'Slettet bruker'} • {new Date(thread.createdAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{(thread as any).replyCount?.toLocaleString?.('nb-NO') ?? thread._count?.replies ?? 0}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{(thread as any).viewCount?.toLocaleString?.('nb-NO') ?? 0}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              {thread.lastReplyAt
                                ? new Date(thread.lastReplyAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {threads.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        onClick={() => handleThreadClick(thread.id)}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Grid>

            {/* Sidebar */}
            <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 1, lg: 2 } }}>
              <Paper
                elevation={0}
                sx={{
                  p: dense ? 1.5 : 2,
                  borderRadius: 1,
                  backgroundColor: "background.paper",
                  border: '1px solid',
                  borderColor: 'divider',
                  position: { lg: 'sticky' },
                  top: { lg: 16 }
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    fontWeight: 600
                  }}
                >
                  <AccessTime sx={{ color: "primary.main" }} />
                  Nylig aktivitet i {category.name}
                </Typography>
                <Stack spacing={1}>
                  {activityLoading ? (
                    // Loading skeletons for recent activity
                    [...Array(5)].map((_, i) => (
                      <Box key={i} sx={{ p: dense ? 0.5 : 1 }}>
                        <Skeleton width="80%" height={18} sx={{ mb: 0.5 }} />
                        <Skeleton width="60%" height={14} />
                      </Box>
                    ))
                  ) : recentActivity.length === 0 ? (
                    <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", textAlign: "center", p: 2 }}>
                      Ingen nylig aktivitet i denne kategorien
                    </Typography>
                  ) : recentActivity.map((activity) => {
                    // Determine the correct URL based on whether this is a thread or reply
                    const url = activity.type === 'thread' || !activity.threadId 
                      ? `/forum/${activity.id}` 
                      : `/forum/${activity.threadId}#${activity.id}`;
                      
                    return (
                      <Link
                        key={activity.id}
                        href={url}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Box
                          sx={{
                            p: { xs: 1.5, sm: 1 },
                            borderRadius: 1,
                            minHeight: { xs: 48, sm: 40 },
                            "&:hover": { backgroundColor: "action.hover" },
                            "&:active": { backgroundColor: "action.selected" },
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: { xs: "0.95rem", sm: "0.9rem" },
                              color: "text.primary",
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {activity.title || activity.threadTitle || activity.content.substring(0, 50) + "..."}
                          </Typography>
                          <Typography sx={{ fontSize: { xs: "0.85rem", sm: "0.8rem" }, color: "text.secondary" }}>
                            {new Date(activity.createdAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })} av {activity.author?.nickname || activity.author?.firstname || 'Slettet bruker'}
                          </Typography>
                        </Box>
                      </Link>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

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
    </Box>
  );
}
