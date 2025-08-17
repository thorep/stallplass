'use client';

import {
  Box,
  Stack,
  Typography,
  Paper,
  Avatar,
  Chip,
  Skeleton,
  Button,
  Divider
} from '@mui/material';
import { Search, Schedule, Forum, Reply, ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ForumSearchResult, ForumSearchResponse } from '@/types/forum';

interface SearchResultsProps {
  searchResults: ForumSearchResponse | undefined;
  loading: boolean;
  error: Error | null;
  query: string;
  onClearSearch: () => void;
}

export function SearchResults({
  searchResults,
  loading,
  error,
  query,
  onClearSearch
}: SearchResultsProps) {
  const router = useRouter();

  const handleResultClick = (result: ForumSearchResult) => {
    if (result.type === 'thread') {
      router.push(`/forum/${result.id}`);
    } else if (result.threadId) {
      // Navigate to thread and scroll to reply
      router.push(`/forum/${result.threadId}#reply-${result.id}`);
    }
  };

  const formatAuthorName = (author: ForumSearchResult['author']) => {
    if (!author) return 'Slettet bruker';
    return author.nickname || author.firstname || 'Anonym';
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'nettopp';
    } else if (diffInHours < 24) {
      return `${diffInHours}t siden`;
    } else {
      const days = Math.floor(diffInHours / 24);
      if (days < 7) {
        return `${days}d siden`;
      } else {
        return new Date(date).toLocaleDateString('nb-NO', { 
          day: 'numeric', 
          month: 'short',
          year: diffInHours > 8760 ? 'numeric' : undefined 
        });
      }
    }
  };

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
          Søket mislyktes
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          {error.message || 'En feil oppstod under søket. Prøv igjen senere.'}
        </Typography>
        <Button onClick={onClearSearch} startIcon={<ArrowBack />}>
          Tilbake til forum
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search sx={{ color: 'primary.main' }} />
            Søkeresultater
          </Typography>
          <Button 
            onClick={onClearSearch}
            startIcon={<ArrowBack />}
            size="small"
            variant="outlined"
          >
            Tilbake til forum
          </Button>
        </Stack>

        {loading ? (
          <Skeleton width={200} height={24} />
        ) : (
          <Typography sx={{ color: 'text.secondary' }}>
            {query && (
              <>
                {searchResults?.results.length || 0} resultat
                {(searchResults?.results.length || 0) !== 1 ? 'er' : ''} for &quot;{query}&quot;
              </>
            )}
            {!query && 'Skriv inn et søkeord for å komme i gang'}
          </Typography>
        )}
      </Box>

      {/* Loading State */}
      {loading && (
        <Stack spacing={2}>
          {[...Array(5)].map((_, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 3,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton width={120} height={20} />
                  <Skeleton width={80} height={20} />
                </Box>
                <Skeleton width="90%" height={20} />
                <Skeleton width="70%" height={16} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton width={60} height={24} />
                  <Skeleton width={80} height={24} />
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* No Results */}
      {!loading && searchResults && searchResults.results.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
            Ingen resultater funnet
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            {query ? (
              <>Prøv andre søkeord eller juster filtrene dine.</>
            ) : (
              <>Skriv inn et søkeord for å finne relevante diskusjoner.</>
            )}
          </Typography>
          <Button onClick={onClearSearch} startIcon={<ArrowBack />}>
            Tilbake til forum
          </Button>
        </Box>
      )}

      {/* Results */}
      {!loading && searchResults && searchResults.results.length > 0 && (
        <Stack spacing={2}>
          {searchResults.results.map((result, index) => (
            <Paper
              key={result.id}
              elevation={0}
              sx={{
                p: 3,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handleResultClick(result)}
            >
              <Stack spacing={2}>
                {/* Header with author and metadata */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                      {formatAuthorName(result.author).charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {formatAuthorName(result.author)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDate(result.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Chip
                    icon={result.type === 'thread' ? <Forum /> : <Reply />}
                    label={result.type === 'thread' ? 'Tråd' : 'Svar'}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>

                {/* Title (for threads) */}
                {result.title && (
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'primary.main',
                      lineHeight: 1.3
                    }}
                  >
                    {result.title}
                  </Typography>
                )}

                {/* Thread title (for replies) */}
                {result.type === 'reply' && result.threadTitle && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <Reply sx={{ fontSize: 14 }} />
                    Svar i: {result.threadTitle}
                  </Typography>
                )}

                {/* Excerpt */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.primary',
                    lineHeight: 1.5,
                    // Preserve search highlights if they exist in the excerpt
                    '& mark': {
                      backgroundColor: 'warning.light',
                      color: 'warning.contrastText',
                      fontWeight: 600,
                      padding: '0 2px',
                      borderRadius: 0.5
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: result.excerpt }}
                />

                {/* Tags and metadata */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {result.category && (
                      <Chip
                        label={result.category.name}
                        size="small"
                        sx={{
                          backgroundColor: result.category.color || 'primary.main',
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                    {result.hasImages && (
                      <Chip
                        label="📷"
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', minWidth: 32 }}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {result.type === 'thread' && result.replyCount > 0 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {result.replyCount} svar
                      </Typography>
                    )}
                    {result.reactions.length > 0 && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {result.reactions.reduce((sum, r) => sum + r.count, 0)} reaksjoner
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>

              {index < searchResults.results.length - 1 && (
                <Divider sx={{ mt: 2, mb: -1 }} />
              )}
            </Paper>
          ))}

          {/* Pagination info */}
          {searchResults.pagination.hasMore && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Viser {searchResults.results.length} av {searchResults.pagination.total} resultater
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}