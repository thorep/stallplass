'use client';

import {
  TextField,
  InputAdornment,
  Box,
  Autocomplete,
  Chip,
  Paper,
  Typography,
  Stack,
  CircularProgress
} from '@mui/material';
import { Search, FilterList, Close } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import { useForumCategories } from '@/hooks/useForum';
import type { ForumCategory } from '@/types/forum';

// Use the ForumSearchFilters from types but with category objects for UI
interface SearchFilters {
  query: string;
  categories: ForumCategory[];
  author: string;
  hasImages: boolean;
  sortBy: 'relevance' | 'newest' | 'oldest' | 'most_replies';
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  placeholder?: string;
}

export function SearchBar({ 
  onSearch, 
  loading = false, 
  placeholder = "Søk i forumet..." 
}: SearchBarProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    author: '',
    hasImages: false,
    sortBy: 'relevance'
  });

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useForumCategories();

  // Debounced search function
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedSearch = useCallback((searchFilters: SearchFilters) => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Only search if there's a query or active filters
    if (searchFilters.query.trim() || searchFilters.categories.length > 0 || searchFilters.author.trim()) {
      const newTimeoutId = setTimeout(() => {
        onSearch(searchFilters);
        setTimeoutId(null);
      }, 300);
      setTimeoutId(newTimeoutId);
    } else {
      // Clear search immediately if no query/filters
      onSearch(searchFilters);
      setTimeoutId(null);
    }
  }, [onSearch, timeoutId]);

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    const updatedFilters = { ...filters, query: value };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  const handleCategoryChange = (selectedCategories: ForumCategory[]) => {
    const updatedFilters = { ...filters, categories: selectedCategories };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  const handleAuthorChange = (value: string) => {
    const updatedFilters = { ...filters, author: value };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    const updatedFilters = { ...filters, sortBy };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      categories: [],
      author: '',
      hasImages: false,
      sortBy: 'relevance'
    };
    setSearchQuery('');
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.author || filters.hasImages;

  return (
    <Box sx={{ maxWidth: { xs: '100%', md: 600 } }}>
      {/* Main search field */}
      <TextField
        fullWidth
        size="small"
        value={searchQuery}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={16} sx={{ color: 'text.secondary' }} />
              ) : (
                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
              )}
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {(hasActiveFilters || searchQuery) && (
                  <Chip
                    label={<Close sx={{ fontSize: 14 }} />}
                    size="small"
                    onClick={clearFilters}
                    sx={{ 
                      minWidth: 24, 
                      height: 24, 
                      '& .MuiChip-label': { px: 0.5 },
                      cursor: 'pointer' 
                    }}
                  />
                )}
                <Chip
                  label={<FilterList sx={{ fontSize: 14 }} />}
                  size="small"
                  variant={showAdvanced ? 'filled' : 'outlined'}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  sx={{ 
                    minWidth: 24, 
                    height: 24, 
                    '& .MuiChip-label': { px: 0.5 },
                    cursor: 'pointer' 
                  }}
                />
              </Box>
            </InputAdornment>
          ),
        }}
      />

      {/* Advanced filters */}
      {showAdvanced && (
        <Paper
          elevation={2}
          sx={{
            mt: 1,
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Stack spacing={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Avanserte filtre
            </Typography>

            {/* Category filter */}
            <Autocomplete
              multiple
              size="small"
              options={categories}
              getOptionLabel={(option) => option.name}
              value={filters.categories}
              onChange={(_, selectedCategories) => handleCategoryChange(selectedCategories)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.name}
                    size="small"
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Velg kategorier..."
                  variant="outlined"
                />
              )}
            />

            {/* Author filter */}
            <TextField
              size="small"
              label="Forfatter"
              value={filters.author}
              onChange={(e) => handleAuthorChange(e.target.value)}
              placeholder="Søk etter forfatter..."
            />

            {/* Sort options */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Sortering
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                {[
                  { value: 'relevance', label: 'Relevans' },
                  { value: 'newest', label: 'Nyeste' },
                  { value: 'oldest', label: 'Eldste' },
                  { value: 'most_replies', label: 'Flest svar' }
                ].map((sort) => (
                  <Chip
                    key={sort.value}
                    label={sort.label}
                    size="small"
                    variant={filters.sortBy === sort.value ? 'filled' : 'outlined'}
                    onClick={() => handleSortChange(sort.value as SearchFilters['sortBy'])}
                    sx={{ 
                      cursor: 'pointer',
                      minHeight: { xs: 32, sm: 24 },
                      fontSize: { xs: '0.8rem', sm: '0.75rem' }
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Active filters summary */}
            {hasActiveFilters && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Aktive filtre
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {filters.categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      size="small"
                      onDelete={() => {
                        const newCategories = filters.categories.filter(c => c.id !== category.id);
                        handleCategoryChange(newCategories);
                      }}
                    />
                  ))}
                  {filters.author && (
                    <Chip
                      label={`Forfatter: ${filters.author}`}
                      size="small"
                      onDelete={() => handleAuthorChange('')}
                    />
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}