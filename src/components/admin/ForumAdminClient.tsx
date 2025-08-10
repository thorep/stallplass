'use client';

import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  IconButton,
  Stack,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Forum as ForumIcon,
  Message as MessageIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useForumCategories } from '@/hooks/useForum';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { ForumCategory, CreateCategoryInput } from '@/types/forum';

interface ForumAdminClientProps {
  user: User;
}

interface ForumStats {
  totalThreads: number;
  totalPosts: number;
  totalCategories: number;
  activeUsers: number;
}

export function ForumAdminClient({ user }: ForumAdminClientProps) {
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    slug: '',
    description: '',
    color: '#2563eb',
    icon: '💬',
    sortOrder: 0,
    isActive: true
  });

  const queryClient = useQueryClient();
  const { data: categories, isLoading: categoriesLoading } = useForumCategories();

  // Get forum statistics with caching (heavy queries)
  const { data: stats, isLoading: statsLoading } = useQuery<ForumStats>({
    queryKey: ['admin', 'forum-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/forum/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - stats don't need to be real-time
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await fetch('/api/forum/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      setOpenCategoryDialog(false);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        color: '#2563eb',
        icon: '💬',
        sortOrder: 0,
        isActive: true
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCategoryInput> }) => {
      const response = await fetch(`/api/forum/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
      setOpenCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        color: '#2563eb',
        icon: '💬',
        sortOrder: 0,
        isActive: true
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/forum/categories/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'categories'] });
    }
  });

  const handleOpenDialog = (category?: ForumCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || '#2563eb',
        icon: category.icon || '💬',
        sortOrder: category.sortOrder,
        isActive: category.isActive
      });
    }
    setOpenCategoryDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenCategoryDialog(false);
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      color: '#2563eb',
      icon: '💬',
      sortOrder: 0,
      isActive: true
    });
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[æ]/g, 'ae')
      .replace(/[ø]/g, 'o')
      .replace(/[å]/g, 'a')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography className="text-h1" sx={{ mb: 3 }}>
        Forum Administrasjon
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ForumIcon color="primary" sx={{ mr: 1 }} />
                <Typography className="text-body-sm" color="textSecondary">
                  Totale Tråder
                </Typography>
              </Box>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography className="text-h2">
                  {stats?.totalThreads?.toLocaleString('nb-NO') || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MessageIcon color="primary" sx={{ mr: 1 }} />
                <Typography className="text-body-sm" color="textSecondary">
                  Totale Innlegg
                </Typography>
              </Box>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography className="text-h2">
                  {stats?.totalPosts?.toLocaleString('nb-NO') || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CategoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography className="text-body-sm" color="textSecondary">
                  Kategorier
                </Typography>
              </Box>
              {categoriesLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography className="text-h2">
                  {categories?.length || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography className="text-body-sm" color="textSecondary">
                  Aktive Brukere
                </Typography>
              </Box>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Typography className="text-h2">
                  {stats?.activeUsers?.toLocaleString('nb-NO') || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Categories Management */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography className="text-h3">
            Kategorier
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={isLoading}
          >
            Ny Kategori
          </Button>
        </Box>

        {categoriesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : categories && categories.length > 0 ? (
          <Grid container spacing={2}>
            {categories.map((category) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ mr: 1, fontSize: '1.2rem' }}>
                          {category.icon}
                        </Typography>
                        <Stack>
                          <Typography className="text-body" fontWeight={500}>
                            {category.name}
                          </Typography>
                          <Typography className="text-caption" color="textSecondary">
                            /{category.slug}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(category)}
                          disabled={isLoading}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          disabled={isLoading}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {category.description && (
                      <Typography className="text-body-sm" color="textSecondary" sx={{ mb: 2 }}>
                        {category.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={category.isActive ? 'Aktiv' : 'Inaktiv'}
                        color={category.isActive ? 'success' : 'default'}
                        sx={{ 
                          backgroundColor: category.color ? `${category.color}20` : undefined,
                          borderColor: category.color,
                        }}
                      />
                      <Typography className="text-caption">
                        {category._count?.posts || 0} innlegg
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            Ingen kategorier funnet. Opprett den første kategorien for å komme i gang.
          </Alert>
        )}
      </Paper>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Rediger Kategori' : 'Ny Kategori'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Navn"
              value={categoryForm.name}
              onChange={(e) => handleNameChange(e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Slug (URL-vennlig navn)"
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
              fullWidth
              required
              helperText="Brukes i URL-er, kun små bokstaver og bindestrek"
            />

            <TextField
              label="Beskrivelse"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Ikon (emoji)"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                sx={{ width: 120 }}
                inputProps={{ maxLength: 2 }}
              />

              <TextField
                label="Farge"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                sx={{ width: 120 }}
              />

              <TextField
                label="Rekkefølge"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) }))}
                sx={{ width: 120 }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!categoryForm.name || !categoryForm.slug || isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : (editingCategory ? 'Oppdater' : 'Opprett')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}