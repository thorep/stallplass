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
  Paper,
  Avatar,
  Collapse
} from '@mui/material';
import { Add, Close, Send, Save, Reply } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { ForumRichTextEditor, ForumRichTextEditorRef } from './ForumRichTextEditor';
import { CategoryBadge } from './CategoryBadge';
import type { ForumCategory, CreateThreadInput, CreateReplyInput, ForumThread, ForumReply } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ForumPostFormProps {
  // Mode configuration
  mode: 'thread' | 'reply';
  threadId?: string; // Required for replies
  categories?: ForumCategory[]; // Required for threads
  
  // User and auth
  user: User | null;
  
  // Form data (for editing)
  initialData?: Partial<ForumThread>;
  isEditing?: boolean;
  
  // Reply-specific props
  quotedPost?: ForumReply | null;
  onClearQuote?: () => void;
  
  // UI configuration
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  showAvatar?: boolean;
  hideCategorySelect?: boolean;
  
  // Event handlers
  onSuccess?: (result: ForumThread | ForumReply) => void;
  onCancel?: () => void;
  className?: string;
  
  // Submission functions - passed in to avoid tight coupling
  onSubmitThread?: (data: CreateThreadInput) => Promise<ForumThread>;
  onSubmitReply?: (data: CreateReplyInput) => Promise<ForumReply>;
}

// Helper functions
function getUserDisplayName(user: User): string {
  const profile = user.user_metadata || {};
  if (profile.nickname) return profile.nickname;
  if (profile.firstname || profile.lastname) {
    return [profile.firstname, profile.lastname].filter(Boolean).join(' ');
  }
  return user.email?.split('@')[0] || 'Anonym bruker';
}

function getUserInitials(user: User): string {
  const name = getUserDisplayName(user);
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function ForumPostForm({
  mode,
  threadId,
  categories = [],
  user,
  initialData,
  isEditing = false,
  quotedPost,
  onClearQuote,
  placeholder,
  autoFocus = false,
  compact = false,
  showAvatar = true,
  hideCategorySelect = false,
  onSuccess,
  onCancel,
  className,
  onSubmitThread,
  onSubmitReply
}: ForumPostFormProps) {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [tags, setTags] = useState<string[]>(
    initialData?.tags?.map(tag => tag.name) || []
  );
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(autoFocus);

  const editorRef = useRef<ForumRichTextEditorRef>(null);

  // Derived values
  const isThread = mode === 'thread';
  const isReply = mode === 'reply';
  const selectedCategory = categories.find(cat => cat.id === categoryId);
  const defaultPlaceholder = isThread 
    ? 'Skriv ditt innlegg her... Bruk formatting-verktøyene for å gjøre innlegget mer lesbart.'
    : '';

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Thread-specific validation
    if (isThread) {
      if (!title.trim()) {
        newErrors.title = 'Tittel er påkrevd';
      } else if (title.trim().length < 3) {
        newErrors.title = 'Tittelen må være minst 3 tegn';
      } else if (title.trim().length > 200) {
        newErrors.title = 'Tittelen kan ikke være lengre enn 200 tegn';
      }
      
      if (!categoryId && !hideCategorySelect) {
        newErrors.categoryId = 'Kategori er påkrevd';
      }
    }
    
    // Content validation (both thread and reply)
    if (!content.trim()) {
      newErrors.content = isThread ? 'Innhold er påkrevd' : 'Svar kan ikke være tomt';
    } else if (content.trim().length < (isThread ? 10 : 3)) {
      newErrors.content = isThread 
        ? 'Innholdet må være minst 10 tegn'
        : 'Svaret må være minst 3 tegn';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) {
      console.log('[FORUM FORM] Form already submitting, ignoring duplicate click');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setErrors({ submit: 'Du må være logget inn' });
      return;
    }

    console.log('[FORUM FORM] Starting submission, setting loading state');
    setIsLoading(true);
    
    try {
      // Upload pending images and get updated content with real URLs
      const finalContent = editorRef.current 
        ? await editorRef.current.uploadPendingImages()
        : content.trim();

      let result;
      
      if (isThread) {
        if (!onSubmitThread) {
          throw new Error('onSubmitThread function is required for thread mode');
        }
        
        console.log('[FORUM FORM] Preparing thread data:', {
          categoryId,
          initialDataCategoryId: initialData?.categoryId,
          hideCategorySelect,
          willSend: categoryId || undefined
        });
        
        // Ensure categoryId is included when set
        const threadData: CreateThreadInput = {
          title: title.trim(),
          content: finalContent,
          categoryId: categoryId || undefined,
          tags: tags.length > 0 ? tags : undefined
        };
        
        console.log('[FORUM FORM] Sending thread data:', threadData);
        
        result = await onSubmitThread(threadData);
      } else {
        if (!onSubmitReply || !threadId) {
          throw new Error('onSubmitReply function and threadId are required for reply mode');
        }
        
        const replyData: CreateReplyInput = {
          content: finalContent
        };
        
        result = await onSubmitReply(replyData);
      }

      // Reset form
      setTitle('');
      setContent('');
      setCategoryId('');
      setTags([]);
      setNewTag('');
      setErrors({});
      setIsOpen(false);
      
      onSuccess?.(result);
    } catch (error) {
      console.error('Failed to submit:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'En feil oppstod'
      });
    } finally {
      setIsLoading(false);
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

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setErrors({});
    setIsOpen(false);
    onCancel?.();
  };

  // For compact reply mode, show a collapsed state initially
  if (isReply && compact && !isOpen && !autoFocus) {
    return (
      <Box className={className}>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outlined"
          startIcon={<Reply />}
          fullWidth
          sx={{ borderRadius: 2 }}
        >
          Skriv et svar...
        </Button>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Paper 
        className={cn('p-4', isReply && compact && 'p-3')}
        sx={{ 
          borderRadius: 1, 
          boxShadow: 0,
          border: '1px solid',
          borderColor: isThread ? 'primary.200' : 'secondary.200',
          backgroundColor: isThread ? 'primary.100' : 'secondary.100',
          position: 'relative',
          opacity: isLoading ? 0.7 : 1,
          pointerEvents: isLoading ? 'none' : 'auto'
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1000,
              borderRadius: 1
            }}
          >
            <Stack spacing={2} alignItems="center">
              <CircularProgress size={40} />
              <Typography className="text-body font-medium">
                {isThread ? 'Oppretter tråd...' : 'Sender svar...'}
              </Typography>
            </Stack>
          </Box>
        )}
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Header - only show for threads or when editing */}
            {(isThread || isEditing || (onCancel && !compact)) && (
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ minHeight: '40px' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                  {isReply && showAvatar && user && (
                    <Avatar 
                      sx={{ 
                        width: 28, 
                        height: 28,
                        backgroundColor: 'secondary.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}
                    >
                      {getUserInitials(user)}
                    </Avatar>
                  )}
                  
                  <Typography 
                    className={cn(
                      "font-medium",
                      isThread ? "text-lg" : "text-base"
                    )}
                    sx={{ 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {isEditing 
                      ? (isThread ? 'Rediger tråd' : 'Rediger svar')
                      : (isThread ? 'Opprett ny tråd' : 'Skriv et svar')
                    }
                  </Typography>
                </Stack>
                
                {(onCancel || (isReply && compact)) && (
                  <Button
                    onClick={handleCancel}
                    variant="outlined"
                    startIcon={<Close />}
                    disabled={isLoading}
                    size={isReply ? "small" : "medium"}
                    sx={{ flexShrink: 0, ml: 2 }}
                  >
                    Avbryt
                  </Button>
                )}
              </Stack>
            )}

            {/* Title field - only for threads */}
            {isThread && (
              <FormControl fullWidth>
                <TextField
                  label="Tittel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Skriv en beskrivende tittel..."
                  disabled={isLoading}
                  slotProps={{ 
                    htmlInput: { maxLength: 200 }
                  }}
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
            )}

            {/* Category selection - only for threads */}
            {isThread && (
              <Stack spacing={2}>
                {!hideCategorySelect ? (
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
                ) : (
                  categoryId && selectedCategory && (
                    <Box>
                      <Typography className="text-caption text-gray-600 mb-1">
                        Publiserer i kategori:
                      </Typography>
                      <CategoryBadge category={selectedCategory} />
                    </Box>
                  )
                )}
                
                {!hideCategorySelect && selectedCategory && (
                  <Box>
                    <Typography className="text-caption text-gray-600 mb-1">
                      Valgt kategori:
                    </Typography>
                    <CategoryBadge category={selectedCategory} />
                  </Box>
                )}
              </Stack>
            )}

            {/* Tags - only for threads */}
            {isThread && (
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
            )}

            {/* Quote Box - only for replies */}
            {isReply && quotedPost && (
              <Box
                sx={{
                  p: 2,
                  borderLeft: '4px solid',
                  borderLeftColor: 'primary.main',
                  backgroundColor: 'grey.50',
                  borderRadius: 1
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack spacing={1} sx={{ flexGrow: 1 }}>
                    <Typography className="text-caption font-medium text-primary">
                      Svarer på {quotedPost.author?.nickname || 'Bruker'}:
                    </Typography>
                    <Typography 
                      className="text-body-sm"
                      dangerouslySetInnerHTML={{ 
                        __html: quotedPost.content.length > 200 
                          ? quotedPost.content.substring(0, 200) + '...'
                          : quotedPost.content
                      }}
                    />
                  </Stack>
                  
                  {onClearQuote && (
                    <Button
                      onClick={onClearQuote}
                      size="small"
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <Close fontSize="small" />
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            {/* Content editor */}
            <Stack spacing={2}>
              {isThread && (
                <Typography className="text-body-sm font-medium">
                  Innhold *
                </Typography>
              )}
              
              <ForumRichTextEditor
                ref={editorRef}
                content={content}
                onChange={setContent}
                placeholder={placeholder || defaultPlaceholder}
                minHeight={compact ? 100 : (isThread ? 200 : 150)}
              />
              
              <Typography className="text-caption text-gray-500">
                💡 Tips: Bruk bilde-knappen i verktøylinjen for å legge til bilder. Bildene lastes opp når du publiserer innlegget.
              </Typography>
              
              {errors.content && (
                <Typography className="text-caption text-red-600">
                  {errors.content}
                </Typography>
              )}
            </Stack>

            {/* Submit errors */}
            <Collapse in={!!errors.submit}>
              <Alert severity="error">
                {errors.submit}
              </Alert>
            </Collapse>

            {/* Action buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {(onCancel && !isReply) && (
                <Button
                  onClick={handleCancel}
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
                  ) : isThread ? (
                    <Send />
                  ) : (
                    <Reply />
                  )
                }
                disabled={isLoading}
                sx={{ 
                  borderRadius: 2,
                  minWidth: 120
                }}
              >
                {isLoading 
                  ? (isEditing ? 'Lagrer...' : (isThread ? 'Oppretter...' : 'Svarer...'))
                  : (isEditing ? 'Lagre endringer' : (isThread ? 'Opprett tråd' : 'Send svar'))
                }
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}