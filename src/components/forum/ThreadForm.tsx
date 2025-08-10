'use client';

import { useState, useRef } from 'react';
import { 
  Stack, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Typography, 
  Chip,
  Box,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { Add, Close, Send, Save } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { ForumRichTextEditor } from './ForumRichTextEditor';
import { CategoryBadge } from './CategoryBadge';
import { ForumImageUpload, ForumImageUploadRef } from './ForumImageUpload';
import { useCreateForumThread, useUpdateForumPost } from '@/hooks/useForum';
import type { ForumCategory, CreateThreadInput, ForumThread } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ThreadFormProps {
  categories: ForumCategory[];
  user: User;
  initialData?: Partial<ForumThread>;
  isEditing?: boolean;
  onSuccess?: (thread: ForumThread) => void;
  onCancel?: () => void;
  className?: string;
}

export function ThreadForm({
  categories,
  user,
  initialData,
  isEditing = false,
  onSuccess,
  onCancel,
  className
}: ThreadFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [tags, setTags] = useState<string[]>(
    initialData?.tags?.map(tag => tag.name) || []
  );
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const imageUploadRef = useRef<ForumImageUploadRef>(null);
  
  const createThread = useCreateForumThread();
  const updateThread = useUpdateForumPost(initialData?.id || '', true);
  
  const isLoading = createThread.isPending || updateThread.isPending;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Tittel er påkrevd';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Tittelen må være minst 3 tegn';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Tittelen kan ikke være lengre enn 200 tegn';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Innhold er påkrevd';
    } else if (content.trim().length < 10) {
      newErrors.content = 'Innholdet må være minst 10 tegn';
    }
    
    if (!categoryId) {
      newErrors.categoryId = 'Kategori er påkrevd';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Upload any pending images first
      let uploadedImages = images;
      if (imageUploadRef.current) {
        uploadedImages = await imageUploadRef.current.uploadPendingImages();
      }

      const threadData: CreateThreadInput = {
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || undefined,
        tags: tags.length > 0 ? tags : undefined,
        images: uploadedImages.length > 0 ? uploadedImages : undefined
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateThread.mutateAsync({
          title: threadData.title,
          content: threadData.content,
          categoryId: threadData.categoryId,
          images: threadData.images
        });
      } else {
        result = await createThread.mutateAsync(threadData);
      }

      onSuccess?.(result);
    } catch (error) {
      console.error('Failed to save thread:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'En feil oppstod'
      });
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const selectedCategory = categories.find(cat => cat.id === categoryId);

  return (
    <Paper 
      className={cn('p-6', className)}
      sx={{ borderRadius: 3, boxShadow: 2 }}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography className="text-h3 font-semibold">
              {isEditing ? 'Rediger tråd' : 'Opprett ny tråd'}
            </Typography>
            
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outlined"
                startIcon={<Close />}
                disabled={isLoading}
              >
                Avbryt
              </Button>
            )}
          </Stack>

          {/* Title field */}
          <FormControl fullWidth>
            <TextField
              label="Tittel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              placeholder="Skriv en beskrivende tittel..."
              disabled={isLoading}
              inputProps={{ maxLength: 200 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Typography className="text-caption text-gray-500 mt-1">
              {title.length}/200 tegn
            </Typography>
          </FormControl>

          {/* Category selection */}
          <Stack spacing={2}>
            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                label="Kategori"
                disabled={isLoading}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  <em>Velg en kategori</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>
                        {category.icon || (
                          category.name.toLowerCase().includes('hest') ? '🐴' : '📋'
                        )}
                      </span>
                      <span>{category.name}</span>
                      {category.description && (
                        <Typography className="text-caption text-gray-500">
                          - {category.description}
                        </Typography>
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              {errors.categoryId && (
                <Typography className="text-caption text-red-600 mt-1">
                  {errors.categoryId}
                </Typography>
              )}
            </FormControl>
            
            {selectedCategory && (
              <Box>
                <Typography className="text-caption text-gray-600 mb-1">
                  Valgt kategori:
                </Typography>
                <CategoryBadge category={selectedCategory} />
              </Box>
            )}
          </Stack>

          {/* Tags */}
          <Stack spacing={2}>
            <Typography className="text-body-sm font-medium">
              Tags (valgfritt)
            </Typography>
            
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: '1rem' }}
                />
              ))}
            </Stack>
            
            {tags.length < 5 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Legg til tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  sx={{
                    flexGrow: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                <Button
                  onClick={handleAddTag}
                  variant="outlined"
                  startIcon={<Add />}
                  disabled={!newTag.trim() || isLoading}
                  sx={{ borderRadius: 2 }}
                >
                  Legg til
                </Button>
              </Stack>
            )}
            
            <Typography className="text-caption text-gray-500">
              Du kan legge til opptil 5 tags for å hjelpe andre med å finne tråden din.
            </Typography>
          </Stack>

          {/* Content editor */}
          <Stack spacing={2}>
            <Typography className="text-body-sm font-medium">
              Innhold *
            </Typography>
            
            <ForumRichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Skriv ditt innlegg her... Bruk formatting-verktøyene for å gjøre innlegget mer lesbart."
              minHeight={200}
            />
            
            {errors.content && (
              <Typography className="text-caption text-red-600">
                {errors.content}
              </Typography>
            )}
          </Stack>

          {/* Image upload */}
          <Stack spacing={2}>
            <Typography className="text-body-sm font-medium">
              Bilder (valgfritt)
            </Typography>
            
            <ForumImageUpload
              ref={imageUploadRef}
              images={images}
              onChange={setImages}
              maxImages={5}
              disabled={isLoading}
              title="Legg til bilder til innlegget ditt"
            />
            
            <Typography className="text-caption text-gray-500">
              Du kan laste opp opptil 5 bilder. Bildene vil bli komprimert automatisk.
            </Typography>
          </Stack>

          {/* Submit errors */}
          {errors.submit && (
            <Alert severity="error">
              {errors.submit}
            </Alert>
          )}

          {/* Action buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outlined"
                disabled={isLoading}
                sx={{ borderRadius: 2 }}
              >
                Avbryt
              </Button>
            )}
            
            <Button
              type="submit"
              variant="contained"
              startIcon={
                isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : isEditing ? (
                  <Save />
                ) : (
                  <Send />
                )
              }
              disabled={isLoading}
              sx={{ 
                borderRadius: 2,
                minWidth: 120
              }}
            >
              {isLoading 
                ? (isEditing ? 'Lagrer...' : 'Oppretter...')
                : (isEditing ? 'Lagre endringer' : 'Opprett tråd')
              }
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
}

// Preview mode for showing what the thread will look like
interface ThreadPreviewProps {
  title: string;
  content: string;
  category?: ForumCategory | null;
  tags: string[];
  user: User;
  className?: string;
}

export function ThreadPreview({
  title,
  content,
  category,
  tags,
  user,
  className
}: ThreadPreviewProps) {
  return (
    <Paper 
      className={cn('p-4 border-l-4 border-l-blue-400', className)}
      sx={{ borderRadius: 2, backgroundColor: 'grey.50' }}
    >
      <Stack spacing={3}>
        <Typography className="text-body-sm font-medium text-gray-600 uppercase tracking-wide">
          Forhåndsvisning
        </Typography>
        
        <Stack spacing={2}>
          <Typography className="text-h4 font-semibold">
            {title || 'Tittel...'}
          </Typography>
          
          {category && (
            <CategoryBadge category={category} />
          )}
          
          {tags.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: '1rem' }}
                />
              ))}
            </Stack>
          )}
          
          <Box
            dangerouslySetInnerHTML={{ 
              __html: content || '<p class="text-gray-500">Innhold...</p>' 
            }}
            sx={{
              '& p': { mb: 1 },
              '& p:last-child': { mb: 0 }
            }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}