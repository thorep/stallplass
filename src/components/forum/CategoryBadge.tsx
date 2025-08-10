'use client';

import { Chip, type ChipProps } from '@mui/material';
import { cn } from '@/lib/utils';
import type { ForumCategory } from '@/types/forum';

interface CategoryBadgeProps {
  category: ForumCategory;
  clickable?: boolean;
  size?: ChipProps['size'];
  variant?: ChipProps['variant'];
  onClick?: () => void;
  className?: string;
}

// Color mapping for categories
const getCategoryColor = (color: string | null): ChipProps['color'] => {
  if (!color) return 'default';
  
  switch (color.toLowerCase()) {
    case 'red':
    case 'rød':
      return 'error';
    case 'blue':
    case 'blå':
      return 'info';
    case 'green':
    case 'grønn':
      return 'success';
    case 'purple':
    case 'lilla':
      return 'secondary';
    case 'orange':
    case 'oransje':
      return 'warning';
    default:
      return 'primary';
  }
};

// Icon mapping for categories
const getCategoryIcon = (icon: string | null, name: string): string => {
  if (icon) return icon;
  
  // Default icons based on common category names
  const lowerName = name.toLowerCase();
  if (lowerName.includes('hest') || lowerName.includes('horse')) return '🐴';
  if (lowerName.includes('utstyr') || lowerName.includes('equipment')) return '🔧';
  if (lowerName.includes('konkurranse') || lowerName.includes('competition')) return '🏆';
  if (lowerName.includes('trening') || lowerName.includes('training')) return '💪';
  if (lowerName.includes('helse') || lowerName.includes('health')) return '❤️';
  if (lowerName.includes('tips') || lowerName.includes('råd')) return '💡';
  if (lowerName.includes('kjøp') || lowerName.includes('salg')) return '💰';
  if (lowerName.includes('general') || lowerName.includes('generelt')) return '💬';
  
  return '📋'; // Default icon
};

export function CategoryBadge({
  category,
  clickable = false,
  size = 'small',
  variant = 'filled',
  onClick,
  className
}: CategoryBadgeProps) {
  const icon = getCategoryIcon(category.icon, category.name);
  const color = getCategoryColor(category.color);

  return (
    <Chip
      label={
        <span className="flex items-center gap-1">
          <span className="text-xs">{icon}</span>
          <span className="text-caption font-medium">{category.name}</span>
        </span>
      }
      color={color}
      size={size}
      variant={variant}
      clickable={clickable}
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-200',
        clickable && 'hover:scale-105',
        className
      )}
      sx={{
        borderRadius: '1rem',
        fontWeight: 500,
        '& .MuiChip-label': {
          px: 1,
          py: 0.5
        }
      }}
    />
  );
}

// Variant for displaying multiple categories
interface CategoryBadgeListProps {
  categories: ForumCategory[];
  clickable?: boolean;
  onCategoryClick?: (category: ForumCategory) => void;
  maxVisible?: number;
  className?: string;
}

export function CategoryBadgeList({
  categories,
  clickable = false,
  onCategoryClick,
  maxVisible = 3,
  className
}: CategoryBadgeListProps) {
  const visibleCategories = categories.slice(0, maxVisible);
  const remainingCount = Math.max(0, categories.length - maxVisible);

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleCategories.map((category) => (
        <CategoryBadge
          key={category.id}
          category={category}
          clickable={clickable}
          onClick={() => onCategoryClick?.(category)}
        />
      ))}
      
      {remainingCount > 0 && (
        <Chip
          label={`+${remainingCount}`}
          size="small"
          variant="outlined"
          className="text-caption"
          sx={{ borderRadius: '1rem' }}
        />
      )}
    </div>
  );
}