'use client';

import {
  Paper,
  Stack,
  Typography,
  Box,
  Chip,
  useTheme,
  useMediaQuery,
  Avatar,
  Grid
} from '@mui/material';
import { Forum, TrendingUp, AccessTime } from '@mui/icons-material';
import Link from 'next/link';
import type { ForumCategory } from '@/types/forum';

interface CategorySectionProps {
  title: string;
  description?: string;
  categories: ForumCategory[];
  backgroundColor?: string;
}

export function CategorySection({ 
  title, 
  description, 
  categories,
  backgroundColor = 'primary.main'
}: CategorySectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (categories.length === 0) return null;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        borderRadius: 1,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider'
      }}
    >
      {/* Section Header */}
      <Box
        sx={{
          backgroundColor: backgroundColor,
          color: 'white',
          p: { xs: 1, sm: 1.5 },
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Forum sx={{ fontSize: { xs: 18, sm: 20 } }} />
        <Box>
          <Typography 
            variant="h6" 
            className="text-h6 font-semibold"
            sx={{ 
              color: 'white',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {title.toUpperCase()}
          </Typography>
          {description && !isMobile && (
            <Typography 
              variant="body2"
              className="text-caption"
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.7rem'
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Categories List */}
      <Stack spacing={0}>
        {categories.map((category, index) => (
          <Link 
            key={category.id} 
            href={`/forum/kategori/${category.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <Box
              sx={{
                p: { xs: 1, sm: 1.5 },
                borderBottom: index < categories.length - 1 ? 1 : 0,
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover'
                },
                transition: 'background-color 0.2s'
              }}
            >
              <Grid container spacing={1} alignItems="center">
                {/* Category Icon & Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                    <Avatar
                      sx={{ 
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText',
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        fontSize: { xs: '1rem', sm: '1.25rem' }
                      }}
                    >
                      {category.icon || '📋'}
                    </Avatar>

                    <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body1"
                        className="text-body font-semibold"
                        sx={{ 
                          color: 'text.primary',
                          textDecoration: 'none',
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      >
                        {category.name}
                      </Typography>
                      {category.description && !isMobile && (
                        <Typography 
                          variant="body2"
                          className="text-caption"
                          sx={{ 
                            color: 'text.secondary',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '0.75rem'
                          }}
                        >
                          {category.description}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Grid>

                {/* Stats - Hide on mobile */}
                {!isMobile && (
                  <Grid size={{ md: 2 }}>
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography 
                        variant="body2"
                        className="text-body-sm font-semibold"
                        sx={{ 
                          color: 'text.primary',
                          fontSize: '0.875rem'
                        }}
                      >
                        {category._count?.posts || 0}
                      </Typography>
                      <Typography 
                        variant="body2"
                        className="text-caption"
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.7rem'
                        }}
                      >
                        Tråder
                      </Typography>
                    </Stack>
                  </Grid>
                )}

                {!isMobile && (
                  <Grid size={{ md: 2 }}>
                    <Stack direction="column" alignItems="center" spacing={0}>
                      <Typography 
                        variant="body2"
                        className="text-body-sm font-semibold"
                        sx={{ 
                          color: 'text.primary',
                          fontSize: '0.875rem'
                        }}
                      >
                        {category._count?.replies || 0}
                      </Typography>
                      <Typography 
                        variant="body2"
                        className="text-caption"
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.7rem'
                        }}
                      >
                        Svar
                      </Typography>
                    </Stack>
                  </Grid>
                )}

                {/* Latest Activity */}
                <Grid size={{ xs: 12, md: 2 }}>
                  {category.latestActivity ? (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: 40 }}>
                      <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2"
                          className="text-caption font-semibold"
                          sx={{ 
                            color: 'primary.main',
                            fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {category.latestActivity.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography 
                            variant="body2"
                            className="text-caption"
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: { xs: '0.65rem', sm: '0.7rem' }
                            }}
                          >
                            {new Date(category.latestActivity.createdAt).toLocaleDateString('nb-NO', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Typography>
                          <Typography 
                            variant="body2"
                            className="text-caption"
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: { xs: '0.65rem', sm: '0.7rem' }
                            }}
                          >
                            av {category.latestActivity.author.nickname || 
                                category.latestActivity.author.firstname || 
                                'Ukjent'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: 40 }}>
                      <Typography 
                        variant="body2"
                        className="text-caption"
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          fontStyle: 'italic'
                        }}
                      >
                        Ingen aktivitet
                      </Typography>
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Link>
        ))}
      </Stack>
    </Paper>
  );
}