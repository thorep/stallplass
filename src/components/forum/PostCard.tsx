'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Stack, 
  Typography, 
  Avatar, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Alert,
  Grid,
  Modal,
  Backdrop
} from '@mui/material';
import { 
  MoreVert,
  Edit,
  Delete,
  Reply,
  Flag,
  AccessTime,
  Close,
  ZoomIn
} from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { ReactionButtons } from './ReactionButtons';
import { useDeleteForumPost } from '@/hooks/useForum';
import type { ForumReply, ForumThread } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface PostCardProps {
  post: ForumReply | ForumThread;
  user: User | null;
  isThread?: boolean;
  onEdit?: () => void;
  onReply?: () => void;
  className?: string;
  showReplyButton?: boolean;
  level?: number; // For nested replies (future feature)
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Nå nettopp';
  if (minutes < 60) return `${minutes} min siden`;
  if (hours < 24) return `${hours} time${hours !== 1 ? 'r' : ''} siden`;
  if (days < 7) return `${days} dag${days !== 1 ? 'er' : ''} siden`;
  
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

// Helper to get user display name
function getUserDisplayName(author: ForumReply['author']): string {
  if (author.nickname) return author.nickname;
  if (author.firstname || author.lastname) {
    return [author.firstname, author.lastname].filter(Boolean).join(' ');
  }
  return 'Anonym bruker';
}

// Helper to get user initials for avatar
function getUserInitials(author: ForumReply['author']): string {
  const name = getUserDisplayName(author);
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Image gallery component for posts
function PostImageGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openImage = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentIndex(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setSelectedImage(images[(currentIndex + 1) % images.length]);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setSelectedImage(images[(currentIndex - 1 + images.length) % images.length]);
  };

  return (
    <>
      <Box className="mt-3">
        {images.length === 1 ? (
          // Single image - larger display
          <Box
            className="relative cursor-pointer overflow-hidden rounded-lg"
            onClick={() => openImage(images[0], 0)}
            sx={{
              '&:hover .zoom-overlay': {
                opacity: 1
              }
            }}
          >
            <img
              src={images[0]}
              alt="Forum post bilde"
              className="w-full h-auto max-h-96 object-cover"
            />
            <Box
              className="zoom-overlay absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-200"
              sx={{ opacity: 0 }}
            >
              <ZoomIn className="text-white" fontSize="large" />
            </Box>
          </Box>
        ) : (
          // Multiple images - grid layout
          <Grid container spacing={1}>
            {images.slice(0, 4).map((imageUrl, index) => (
              <Grid key={index} size={{ xs: images.length === 2 ? 6 : images.length === 3 && index === 0 ? 12 : 6 }}>
                <Box
                  className="relative cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => openImage(imageUrl, index)}
                  sx={{
                    aspectRatio: '4/3',
                    '&:hover .zoom-overlay': {
                      opacity: 1
                    }
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={`Forum post bilde ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 3 && images.length > 4 && (
                    <Box
                      className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center"
                    >
                      <Typography className="text-white text-h4 font-semibold">
                        +{images.length - 4}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    className="zoom-overlay absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center transition-opacity duration-200"
                    sx={{ opacity: 0 }}
                  >
                    <ZoomIn className="text-white" />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Image modal */}
      <Modal
        open={!!selectedImage}
        onClose={closeImage}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
          }
        }}
      >
        <Box
          className="absolute inset-0 flex items-center justify-center p-4"
          onClick={closeImage}
        >
          {/* Close button */}
          <IconButton
            className="absolute top-4 right-4 text-white z-10"
            onClick={closeImage}
            size="large"
          >
            <Close fontSize="large" />
          </IconButton>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <IconButton
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                size="large"
                disabled={currentIndex === 0}
              >
                <Box className="text-2xl">‹</Box>
              </IconButton>
              <IconButton
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                size="large"
                disabled={currentIndex === images.length - 1}
              >
                <Box className="text-2xl">›</Box>
              </IconButton>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <Box className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </Box>
          )}

          {/* Image */}
          <img
            src={selectedImage || ''}
            alt="Forum post bilde"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      </Modal>
    </>
  );
}

export function PostCard({
  post,
  user,
  isThread = false,
  onEdit,
  onReply,
  className,
  showReplyButton = true,
  level = 0
}: PostCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const deletePost = useDeleteForumPost(post.id, isThread);
  
  const isOwner = user && post.authorId === user.id;
  const isEdited = new Date(post.updatedAt).getTime() > new Date(post.createdAt).getTime() + 1000;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.();
  };

  const handleReplyClick = () => {
    if (!user) {
      // Redirect to login with current thread URL as return URL
      const currentUrl = window.location.pathname;
      window.location.href = `/logg-inn?returnUrl=${encodeURIComponent(currentUrl)}`;
      return;
    }
    onReply?.();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost.mutateAsync();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setShowDeleteConfirm(true);
  };

  const handleReport = () => {
    handleMenuClose();
    // TODO: Implement reporting functionality
    console.log('Report post:', post.id);
  };

  return (
    <>
      <Card
        className={cn(
          'transition-all duration-200',
          level > 0 && 'ml-8 border-l-4 border-l-blue-200',
          className
        )}
        sx={{ 
          borderRadius: 2,
          ...(level > 0 && {
            borderLeft: '4px solid',
            borderLeftColor: 'primary.light',
            marginLeft: level * 2
          })
        }}
      >
        <CardContent className="p-4">
          <Stack spacing={3}>
            {/* Header with author info and post time */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="flex-start"
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar 
                  src={undefined}
                  sx={{ width: 40, height: 40 }}
                >
                  {getUserInitials(post.author)}
                </Avatar>
                
                <Stack spacing={0}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography className="text-body font-semibold">
                      {getUserDisplayName(post.author)}
                    </Typography>
                    
                    {isThread && (
                      <Chip 
                        label="Tråd eier" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                  
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime fontSize="small" className="text-gray-400" />
                    <Typography className="text-caption text-gray-600">
                      {formatTimeAgo(post.createdAt)}
                      {isEdited && (
                        <span className="text-gray-500"> • redigert</span>
                      )}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>

              {/* Menu button */}
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                className="text-gray-500"
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Stack>

            {/* Post content */}
            <Box>
              <Typography 
                className="text-body prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
                sx={{
                  '& p': { mb: 1 },
                  '& p:last-child': { mb: 0 },
                  '& ul, & ol': { pl: 2 },
                  '& blockquote': { 
                    borderLeft: '4px solid',
                    borderLeftColor: 'grey.300',
                    pl: 2,
                    ml: 0,
                    fontStyle: 'italic',
                    color: 'text.secondary'
                  },
                  '& a': {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }
                }}
              />
              
              {/* Images */}
              <PostImageGallery images={post.images || []} />
            </Box>

            {/* Reactions and actions */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              flexWrap="wrap"
              gap={2}
            >
              <ReactionButtons
                postId={post.id}
                reactions={post.reactions}
                user={user}
                size="small"
              />

              {showReplyButton && !isThread && (
                <IconButton
                  onClick={handleReplyClick}
                  size="small"
                  className="text-gray-500 hover:text-primary"
                >
                  <Reply fontSize="small" />
                  <Typography className="text-caption ml-1">
                    Svar
                  </Typography>
                </IconButton>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isOwner && (
          <>
            <MenuItem onClick={handleEdit}>
              <Edit fontSize="small" className="mr-2" />
              Rediger
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} className="text-red-600">
              <Delete fontSize="small" className="mr-2" />
              Slett
            </MenuItem>
            <Divider />
          </>
        )}
        
        <MenuItem onClick={handleReport}>
          <Flag fontSize="small" className="mr-2" />
          Rapporter
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <Alert 
          severity="warning"
          className="mt-2"
          action={
            <Stack direction="row" spacing={1}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                disabled={isDeleting}
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                className="text-sm px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Sletter...' : 'Slett'}
              </button>
            </Stack>
          }
        >
          Er du sikker på at du vil slette dette {isThread ? 'innlegget' : 'svaret'}? 
          Dette kan ikke angres.
        </Alert>
      )}
    </>
  );
}

// Skeleton loader for post cards
export function PostCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent className="p-4">
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ bgcolor: 'grey.200', borderRadius: '50%', width: 40, height: 40 }} />
              <Stack spacing={0.5}>
                <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 16, width: 120 }} />
                <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 12, width: 80 }} />
              </Stack>
            </Stack>
            <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, width: 24, height: 24 }} />
          </Stack>
          
          <Stack spacing={1}>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 16, width: '100%' }} />
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 16, width: '80%' }} />
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 16, width: '60%' }} />
          </Stack>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              {[...Array(3)].map((_, i) => (
                <Box 
                  key={i}
                  sx={{ bgcolor: 'grey.200', borderRadius: '1rem', height: 24, width: 40 }} 
                />
              ))}
            </Stack>
            <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, height: 20, width: 60 }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}