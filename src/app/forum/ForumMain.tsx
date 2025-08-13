"use client";

import { CategorySection } from "@/components/forum/CategorySection";
import { SearchBar } from "@/components/forum/SearchBar";
import { SearchResults } from "@/components/forum/SearchResults";
import { useForumSections, useTrendingTopics, useRecentActivity, useForumSearch } from "@/hooks/useForum";
import { Forum, TrendingUp, Schedule } from "@mui/icons-material";
import { Box, Skeleton, Stack, Typography, useMediaQuery, useTheme, Grid, Paper, Chip } from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ForumCategory, ForumSearchFilters } from "@/types/forum";
export function ForumMain() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
        categories: categories ? JSON.parse(categories) : [],
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
        params.set('categories', JSON.stringify(apiFilters.categories));
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
    <Box sx={{ py: { xs: 1, sm: 3 }, px: { xs: 0, sm: 2, md: 4 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack spacing={2} sx={{ py: 1, px: { xs: 2, sm: 0 } }}>
          <Typography
            className="text-h3 font-bold"
            sx={{
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Forum fontSize={isMobile ? "medium" : "large"} />
            Forum
          </Typography>
          <Typography
            className="text-body-sm text-gray-600"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Diskuter alt om hester, stell og riding med andre hesteeiere
          </Typography>

          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} loading={searchLoading} />
        </Stack>

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
            {/* Quick Stats & Trending Section */}
        <Grid container spacing={2}>
          {/* Trending Topics */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.paper"
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
          </Grid>

          {/* Recent Activity */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                backgroundColor: "background.paper"
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
                    <Box key={i} sx={{ p: 1 }}>
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
                          {new Date(activity.createdAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })} av {activity.author.nickname || activity.author.firstname || 'Anonym'} • {activity.category?.name || 'Ukategoriserad'}
                        </Typography>
                      </Box>
                    </Link>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Forum Sections */}
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
          </>
        )}
      </Stack>
    </Box>
  );
}
