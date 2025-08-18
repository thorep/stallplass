'use client';

import { useState, useEffect } from 'react';
import { 
  Container,
  Stack,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThreadForm, ThreadPreview } from '@/components/forum/ThreadForm';
import { useForumCategories } from '@/hooks/useForum';
import type { User } from '@supabase/supabase-js';
import type { ForumThread } from '@/types/forum';

interface NewThreadPageProps {
  user: User;
}

export function NewThreadPage({ user }: NewThreadPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get category from URL first
  const categorySlug = searchParams.get('category');
  
  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useForumCategories();
  
  // Find the selected category based on URL
  const urlCategory = categories.find(cat => cat.slug === categorySlug);
  const initialCategoryId = urlCategory?.id || '';
  
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [previewData, setPreviewData] = useState({
    title: '',
    content: '',
    categoryId: initialCategoryId,
    tags: [] as string[]
  });
  
  // Update state when categories load or URL changes
  useEffect(() => {
    console.log('[FORUM PAGE] URL category slug:', categorySlug);
    console.log('[FORUM PAGE] Available categories:', categories.map(c => ({ id: c.id, slug: c.slug, name: c.name })));
    
    if (categorySlug && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.slug === categorySlug);
      console.log('[FORUM PAGE] Found category:', selectedCategory);
      
      if (selectedCategory) {
        setSelectedCategoryId(selectedCategory.id);
        setPreviewData(prev => ({
          ...prev,
          categoryId: selectedCategory.id
        }));
      }
    }
  }, [categorySlug, categories]);

  const handleBack = () => {
    router.back();
  };

  const handleSuccess = (thread: ForumThread) => {
    // Redirect to the newly created thread
    router.push(`/forum/${thread.id}`);
  };

  const handleCancel = () => {
    router.push('/forum');
  };


  const selectedCategory = categories.find(cat => cat.id === previewData.categoryId);

  if (categoriesLoading) {
    return (
      <Container maxWidth="lg" className="py-6">
        <Stack spacing={4}>
          <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: 300 }} />
          <Box sx={{ height: 400, bgcolor: 'grey.100', borderRadius: 2 }} />
        </Stack>
      </Container>
    );
  }

  if (showPreview) {
    return (
      <Container maxWidth="lg" className="py-6">
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
              Ny tråd
            </Typography>
            <Typography className="text-gray-600">
              Forhåndsvisning
            </Typography>
          </Breadcrumbs>

          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography className="text-h2 font-bold">
              Forhåndsvisning av tråd
            </Typography>
            
            <Button
              onClick={() => setShowPreview(false)}
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{ borderRadius: 2 }}
            >
              Tilbake til redigering
            </Button>
          </Stack>

          {/* Preview */}
          <ThreadPreview
            title={previewData.title}
            content={previewData.content}
            category={selectedCategory}
            tags={previewData.tags}
            user={user}
          />

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              onClick={() => setShowPreview(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Rediger videre
            </Button>
            
            <Button
              onClick={() => {
                // TODO: Implement direct publish from preview
                setShowPreview(false);
              }}
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              Publiser tråd
            </Button>
          </Stack>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-6">
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
            Ny tråd
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          justifyContent="space-between" 
          alignItems={isMobile ? 'stretch' : 'center'} 
          spacing={2}
        >
          <Stack spacing={1}>
            <Typography className="text-h2 font-bold">
              Opprett ny tråd
            </Typography>
            <Typography className="text-body text-gray-600">
              Start en ny diskusjon i Stallplass forum
            </Typography>
          </Stack>
          
          <Button
            onClick={handleBack}
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{ borderRadius: 2 }}
          >
            Tilbake til forum
          </Button>
        </Stack>

        {/* Guidelines */}
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography className="text-body-sm font-medium mb-1">
            Før du oppretter en tråd:
          </Typography>
          <Typography className="text-caption">
            • Søk først for å se om temaet allerede er diskutert
            <br />
            • Velg riktig kategori for best synlighet
            <br />
            • Skriv en beskrivende tittel som forklarer hva du ønsker å diskutere
            <br />
            • Vær høflig og respektfull mot andre brukere
          </Typography>
        </Alert>

        {/* Thread Form */}
        <ThreadForm
          categories={categories}
          user={user}
          initialData={urlCategory ? {
            categoryId: urlCategory.id
          } : undefined}
          hideCategorySelect={false}  // Always show category selector for now
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />

        {/* Help Section */}
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          <Typography className="text-body-sm font-medium mb-1">
            Tips for å få gode svar:
          </Typography>
          <Typography className="text-caption">
            • Beskriv situasjonen din tydelig og detaljert
            <br />
            • Legg ved relevante bilder hvis det hjelper
            <br />
            • Bruk tags for å hjelpe andre finne tråden din
            <br />
            • Vær åpen for forskjellige perspektiver og erfaringer
          </Typography>
        </Alert>
      </Stack>
    </Container>
  );
}