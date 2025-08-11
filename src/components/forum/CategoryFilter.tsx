'use client';

import { useState } from 'react';
import { 
  Tabs, 
  Tab, 
  Box, 
  Stack, 
  Chip,
  Button,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import type { ForumCategory } from '@/types/forum';

interface CategoryFilterProps {
  categories: ForumCategory[];
  selectedCategoryId?: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  className?: string;
  variant?: 'tabs' | 'chips' | 'buttons';
  showCount?: boolean;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  className,
  variant = 'tabs',
  showCount = false
}: CategoryFilterProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Auto-switch to chips on mobile for better UX
  const effectiveVariant = isMobile && variant === 'tabs' ? 'chips' : variant;
  
  const handleCategoryClick = (categoryId: string | null) => {
    // Toggle off if clicking same category
    if (selectedCategoryId === categoryId) {
      onCategoryChange(null);
    } else {
      onCategoryChange(categoryId);
    }
  };

  const getCategoryIcon = (category: ForumCategory): string => {
    if (category.icon) return category.icon;
    
    // Default icons based on common category names
    const lowerName = category.name.toLowerCase();
    if (lowerName.includes('hest') || lowerName.includes('horse')) return '🐴';
    if (lowerName.includes('utstyr') || lowerName.includes('equipment')) return '🔧';
    if (lowerName.includes('konkurranse') || lowerName.includes('competition')) return '🏆';
    if (lowerName.includes('trening') || lowerName.includes('training')) return '💪';
    if (lowerName.includes('helse') || lowerName.includes('health')) return '❤️';
    if (lowerName.includes('tips') || lowerName.includes('råd')) return '💡';
    if (lowerName.includes('kjøp') || lowerName.includes('salg')) return '💰';
    if (lowerName.includes('general') || lowerName.includes('generelt')) return '💬';
    
    return '📋';
  };

  if (effectiveVariant === 'tabs') {
    return (
      <Box className={cn('w-full', className)}>
        <Tabs
          value={selectedCategoryId || false}
          onChange={(_, newValue) => handleCategoryClick(newValue === false ? null : newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '1.5px'
            }
          }}
        >
          <Tab
            value={false}
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>📋</span>
                <span>Alle kategorier</span>
                {showCount && (
                  <Chip 
                    label={categories.reduce((sum, cat) => sum + (cat._count?.posts || 0), 0)}
                    size="small" 
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
            }
            sx={{ minHeight: 48 }}
          />
          
          {categories.map((category) => (
            <Tab
              key={category.id}
              value={category.id}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{getCategoryIcon(category)}</span>
                  <span>{category.name}</span>
                  {showCount && category._count?.posts && (
                    <Chip 
                      label={category._count.posts}
                      size="small" 
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Stack>
              }
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Box>
    );
  }

  if (effectiveVariant === 'chips') {
    return (
      <Stack 
        direction="row" 
        spacing={1} 
        flexWrap="wrap"
        alignItems="center"
        className={cn('w-full', className)}
      >
        <FilterList fontSize="small" className="text-gray-500" />
        
        <Chip
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span>📋</span>
              <span>Alle</span>
              {showCount && (
                <span className="text-xs ml-1 px-1 py-0.5 bg-white bg-opacity-30 rounded">
                  {categories.reduce((sum, cat) => sum + (cat._count?.posts || 0), 0)}
                </span>
              )}
            </Stack>
          }
          onClick={() => handleCategoryClick(null)}
          variant={selectedCategoryId === null ? 'filled' : 'outlined'}
          color={selectedCategoryId === null ? 'primary' : 'default'}
          className="cursor-pointer"
          sx={{ borderRadius: '1rem' }}
        />

        {categories.map((category) => (
          <Chip
            key={category.id}
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <span>{getCategoryIcon(category)}</span>
                <span>{category.name}</span>
                {showCount && category._count?.posts && (
                  <span className="text-xs ml-1 px-1 py-0.5 bg-white bg-opacity-30 rounded">
                    {category._count.posts}
                  </span>
                )}
              </Stack>
            }
            onClick={() => handleCategoryClick(category.id)}
            variant={selectedCategoryId === category.id ? 'filled' : 'outlined'}
            color={selectedCategoryId === category.id ? 'primary' : 'default'}
            className="cursor-pointer"
            sx={{ borderRadius: '1rem' }}
          />
        ))}

        {selectedCategoryId && (
          <Button
            startIcon={<Clear fontSize="small" />}
            onClick={() => onCategoryChange(null)}
            size="small"
            variant="text"
            className="text-gray-500 hover:text-gray-700"
          >
            Fjern filter
          </Button>
        )}
      </Stack>
    );
  }

  if (effectiveVariant === 'buttons') {
    return (
      <Stack spacing={2} className={cn('w-full', className)}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography className="text-body-sm font-medium text-gray-700">
            Filtrer etter kategori:
          </Typography>
          
          {selectedCategoryId && (
            <Button
              startIcon={<Clear fontSize="small" />}
              onClick={() => onCategoryChange(null)}
              size="small"
              variant="outlined"
              className="text-gray-600 border-gray-300"
            >
              Fjern filter
            </Button>
          )}
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            onClick={() => handleCategoryClick(null)}
            variant={selectedCategoryId === null ? 'contained' : 'outlined'}
            startIcon={<span>📋</span>}
            sx={{ borderRadius: 1 }}
          >
            Alle kategorier
            {showCount && (
              <Chip 
                label={categories.reduce((sum, cat) => sum + (cat._count?.posts || 0), 0)}
                size="small" 
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem', ml: 1 }}
              />
            )}
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              variant={selectedCategoryId === category.id ? 'contained' : 'outlined'}
              startIcon={<span>{getCategoryIcon(category)}</span>}
              sx={{ 
                borderRadius: 1
              }}
            >
              {category.name}
              {showCount && category._count?.posts && (
                <Chip 
                  label={category._count.posts}
                  size="small" 
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem', ml: 1 }}
                />
              )}
            </Button>
          ))}
        </Box>
      </Stack>
    );
  }

  return null;
}

// Compact version for sidebars or mobile
interface CompactCategoryFilterProps {
  categories: ForumCategory[];
  selectedCategoryId?: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  maxVisible?: number;
  className?: string;
}

export function CompactCategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  maxVisible = 5,
  className
}: CompactCategoryFilterProps) {
  const [showAll, setShowAll] = useState(false);
  
  const visibleCategories = showAll ? categories : categories.slice(0, maxVisible);
  const hasMore = categories.length > maxVisible;
  
  const getCategoryIcon = (category: ForumCategory): string => {
    if (category.icon) return category.icon;
    return '📋';
  };

  return (
    <Stack spacing={1} className={cn('w-full', className)}>
      <Typography className="text-body-sm font-semibold text-gray-800">
        Kategorier
      </Typography>
      
      <Stack spacing={0.5}>
        <Button
          onClick={() => onCategoryChange(null)}
          variant={selectedCategoryId === null ? 'contained' : 'text'}
          size="small"
          startIcon={<span>📋</span>}
          fullWidth
          sx={{ 
            justifyContent: 'flex-start',
            borderRadius: 1,
            textTransform: 'none'
          }}
        >
          Alle kategorier
        </Button>

        {visibleCategories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            variant={selectedCategoryId === category.id ? 'contained' : 'text'}
            size="small"
            startIcon={<span>{getCategoryIcon(category)}</span>}
            fullWidth
            sx={{ 
              justifyContent: 'flex-start',
              borderRadius: 1,
              textTransform: 'none'
            }}
          >
            {category.name}
            {category._count?.posts && (
              <Chip 
                label={category._count.posts}
                size="small" 
                variant="outlined"
                sx={{ 
                  height: 16, 
                  fontSize: '0.65rem', 
                  ml: 'auto',
                  mr: 0
                }}
              />
            )}
          </Button>
        ))}
        
        {hasMore && (
          <Button
            onClick={() => setShowAll(!showAll)}
            size="small"
            variant="text"
            className="text-gray-600"
            sx={{ textTransform: 'none' }}
          >
            {showAll ? 'Vis færre' : `Vis ${categories.length - maxVisible} flere`}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}