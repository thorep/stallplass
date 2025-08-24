"use client";

import { CategorySection } from "@/components/forum/CategorySection";
import { SearchBar } from "@/components/forum/SearchBar";
import { SearchResults } from "@/components/forum/SearchResults";
import { useForumSections, useTrendingTopics, useRecentActivity, useForumSearch } from "@/hooks/useForum";
import { Forum, TrendingUp, Schedule } from "@mui/icons-material";
import { Box, Skeleton, Stack, Typography, Grid, Paper, Chip, Switch, FormControlLabel } from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ForumCategory, ForumSearchFilters } from "@/types/forum";
import { useForumView } from "@/hooks/useForumView";
export function ForumMain() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dense, setDense } = useForumView();
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState<ForumSearchFilters | null>(null);

  // Initialize search state from URL parameters
  useEffect(() => {
    const query = searchParams.get('q');
    const categories = searchParams.get('categories');
    const author = searchParams.get('author');
    const hasImages = searchParams.get('hasImages') === 'true';
    const sortBy = searchParams.get('sortBy') as ForumSearchFilters['sortBy'];

    if (query || categories || author || hasImages) {
      const filters: ForumSearchFilters = {
        query: query || '',
        // Support comma-separated list (preferred) or JSON array (backwards compatible)
        categories: categories
          ? (() => {
              try {
                const parsed = JSON.parse(categories);
                return Array.isArray(parsed)
                  ? parsed
                  : categories.split(',').map((c) => c.trim()).filter(Boolean);
              } catch {
                return categories.split(',').map((c) => c.trim()).filter(Boolean);
              }
            })()
          : [],
        author: author || '',
        hasImages,
        sortBy: sortBy || 'relevance',
        limit: 20,
        offset: 0
      };
      setSearchFilters(filters);
      setIsSearching(true);
    }
  }, [searchParams]);

  // Fetch sections with categories
  const { data: sections = [], isLoading: sectionsLoading } = useForumSections();

  // Fetch trending topics and recent activity
  const { data: trendingTopics = [], isLoading: trendingLoading, error: trendingError } = useTrendingTopics({ limit: 5 });
  const { data: recentActivity = [], isLoading: activityLoading, error: activityError } = useRecentActivity({ limit: 5 });
  
  // Search functionality
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useForumSearch(
    searchFilters || { query: '' },
    !!searchFilters && isSearching
  );

  // Clear search function
  const clearSearch = useCallback(() => {
    setIsSearching(false);
    setSearchFilters(null);
    router.push('/forum', { scroll: false });
  }, [router]);

  // Handle search functionality  
  const handleSearch = useCallback((filters: {
    query: string;
    categories: ForumCategory[];
    author: string;
    hasImages: boolean;
    sortBy: string;
  }) => {
    // Convert UI filters to API filters
    const apiFilters: ForumSearchFilters = {
      query: filters.query.trim(),
      categories: filters.categories.map(cat => cat.id),
      author: filters.author.trim(),
      hasImages: filters.hasImages,
      sortBy: filters.sortBy as ForumSearchFilters['sortBy'],
      limit: 20,
      offset: 0
    };
    
    // Only search if we have a query or filters
    const hasSearchCriteria = apiFilters.query || 
                             (apiFilters.categories && apiFilters.categories.length > 0) || 
                             apiFilters.author;
    
    if (hasSearchCriteria) {
      setSearchFilters(apiFilters);
      setIsSearching(true);
      
      // Update URL parameters for sharing/bookmarking
      const params = new URLSearchParams();
      if (apiFilters.query) params.set('q', apiFilters.query);
      if (apiFilters.categories && apiFilters.categories.length > 0) {
        params.set('categories', apiFilters.categories.join(','));
      }
      if (apiFilters.author) params.set('author', apiFilters.author);
      if (apiFilters.hasImages) params.set('hasImages', 'true');
      if (apiFilters.sortBy && apiFilters.sortBy !== 'relevance') params.set('sortBy', apiFilters.sortBy);
      
      const newUrl = params.toString() ? `/forum?${params.toString()}` : '/forum';
      router.push(newUrl, { scroll: false });
    } else {
      clearSearch();
    }
  }, [router, clearSearch]);

  return (
    <Box sx={{ 
      py: { xs: 0, sm: dense ? 0.5 : 1 }, 
      px: { xs: 0, sm: dense ? 0.5 : 1, md: dense ? 1 : 2 },
      maxWidth: { xs: '100%', lg: '1400px' },
      mx: 'auto',
      backgroundColor: 'grey.100',
      minHeight: '100vh'
    }}>
      <Stack spacing={dense ? 1.25 : 2}>
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: dense ? 0.75 : 1, 
            border: '1px solid',
            borderColor: 'primary.200',
            backgroundColor: 'primary.50'
          }}
        >
          <Stack spacing={dense ? 1 : 2} sx={{ py: dense ? 1 : 2, px: dense ? 1.5 : 2 }}>
            <Typography
              className="text-xl font-semibold"
              sx={{
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Forum fontSize="medium" />
              Forum
            </Typography>

            {/* Search Bar */}
            <SearchBar onSearch={handleSearch} loading={searchLoading} />

            {/* Compact toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FormControlLabel
                control={<Switch size="small" checked={dense} onChange={(_, v) => setDense(v)} />}
                label={<Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Kompakt visning</Typography>}
              />
            </Box>
          </Stack>
        </Paper>

        {/* Search Results or Forum Content */}
        {isSearching ? (
          <SearchResults
            searchResults={searchResults}
            loading={searchLoading}
            error={searchError}
            query={searchFilters?.query || ''}
            onClearSearch={clearSearch}
          />
        ) : (
          <>
            {/* Main Layout with Sidebar */}
            <Grid container spacing={dense ? 1.5 : 2}>
              {/* Main Content */}
              <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 2, lg: 1 } }}>
                <Stack spacing={dense ? 1.25 : 2}>
                  {/* Trending Topics Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: dense ? 1.5 : 2,
                      borderRadius: 1,
                      backgroundColor: "background.paper",
                      border: '1px solid',
                      borderColor: 'grey.200'
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
                      <TrendingUp sx={{ color: "orange" }} />
                      Populære emner
                    </Typography>
              <Stack spacing={1}>
                {trendingLoading ? (
                  // Loading skeletons for trending topics
                  [...Array(3)].map((_, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1 }}>
                      <Skeleton width="70%" height={20} />
                      <Skeleton width={30} height={20} />
                    </Box>
                  ))
                ) : trendingError ? (
                  <Typography sx={{ fontSize: "0.8rem", color: "error.main", textAlign: "center", p: 2 }}>
                    Kunne ikke laste populære emner
                  </Typography>
                ) : trendingTopics.length === 0 ? (
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", textAlign: "center", p: 2 }}>
                    Ingen populære emner for øyeblikket
                  </Typography>
                ) : trendingTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/forum/${topic.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
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
                          fontSize: "0.9rem",
                          color: "text.primary",
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {topic.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {topic.trendingScore > 50 && (
                          <Chip
                            label="🔥"
                            size="small"
                            sx={{
                              backgroundColor: "orange",
                              color: "white",
                              minWidth: 24,
                              height: 20,
                              fontSize: "0.7rem"
                            }}
                          />
                        )}
                        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {topic.replyCount || topic._count?.replies || 0}
                        </Typography>
                      </Stack>
                    </Box>
                  </Link>
                ))}
                    </Stack>
                  </Paper>

                  {/* Forum Categories */}
                  <Stack spacing={1}>
                    {sectionsLoading ? (
                      // Loading skeletons for sections
                      [...Array(3)].map((_, i) => (
                        <Box key={i}>
                          <Skeleton height={40} sx={{ borderRadius: 1, mb: 0.5 }} />
                          <Skeleton height={80} sx={{ borderRadius: 1 }} />
                        </Box>
                      ))
                    ) : sections.length > 0 ? (
                      sections.map((section) => (
                        <CategorySection
                          key={section.id}
                          title={section.name}
                          description={section.description || undefined}
                          categories={section.categories}
                          backgroundColor={section.color || "primary.main"}
                        />
                      ))
                    ) : (
                      // Empty state when no sections
                      <Box
                        sx={{
                          p: 4,
                          textAlign: "center",
                          borderRadius: 1,
                          backgroundColor: "grey.50",
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Forum sx={{ fontSize: 32, color: "grey.400", mb: 1 }} />
                        <Typography className="text-h5 text-gray-600 mb-1">
                          Ingen forum kategorier ennå
                        </Typography>
                        <Typography className="text-body-sm text-gray-500">
                          Forum kategorier vil vises her når de er opprettet
                        </Typography>
                      </Box>
                    )}
                  </Stack>
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
                    borderColor: 'grey.200',
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
                <Schedule sx={{ color: "primary.main" }} />
                Nylig aktivitet
              </Typography>
              <Stack spacing={1}>
                {activityLoading ? (
                  // Loading skeletons for recent activity
                  [...Array(3)].map((_, i) => (
                    <Box key={i} sx={{ p: dense ? 0.5 : 1 }}>
                      <Skeleton width="80%" height={18} sx={{ mb: 0.5 }} />
                      <Skeleton width="60%" height={14} />
                    </Box>
                  ))
                ) : activityError ? (
                  <Typography sx={{ fontSize: "0.8rem", color: "error.main", textAlign: "center", p: 2 }}>
                    Kunne ikke laste nylig aktivitet
                  </Typography>
                ) : recentActivity.length === 0 ? (
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", textAlign: "center", p: 2 }}>
                    Ingen nylig aktivitet
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
                          p: { xs: dense ? 1 : 1.5, sm: 1 },
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
                          {new Date(activity.createdAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })} av {activity.author?.nickname || activity.author?.firstname || 'Slettet bruker'} • {activity.category?.name || 'Ukategorisert'}
                        </Typography>
                      </Box>
                    </Link>
                  );
                })}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Stack>
    </Box>
  );
}
