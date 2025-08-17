'use client';

import { useState } from 'react';
import Image from 'next/image';
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
  Grid
} from '@mui/material';
import { 
  MoreVert,
  Edit,
  Delete,
  Reply,
  Flag
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
function getUserDisplayName(author: ForumReply['author'] | null): string {
  if (!author) return 'Bruker finnes ikke';
  if (author.nickname) return author.nickname;
  if (author.firstname || author.lastname) {
    return [author.firstname, author.lastname].filter(Boolean).join(' ');
  }
  return 'Anonym bruker';
}

// Helper to get user initials for avatar
function getUserInitials(author: ForumReply['author'] | null): string {
  const name = getUserDisplayName(author);
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Image gallery component for posts
function PostImageGallery({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;

  return (
    <Box className="mt-3">
      {images.length === 1 ? (
        // Single image - let Next.js Image handle sizing
        <Image
          src={images[0]}
          alt="Forum post bilde"
          width={800}
          height={600}
          className="rounded-lg max-w-full h-auto"
          style={{ 
            maxWidth: '800px',
            height: 'auto'
          }}
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          sizes="(max-width: 768px) 90vw, 800px"
          quality={85}
        />
      ) : (
        // Multiple images - grid layout
        <Grid container spacing={1}>
          {images.slice(0, 4).map((imageUrl, index) => (
            <Grid key={index} size={{ xs: images.length === 2 ? 6 : images.length === 3 && index === 0 ? 12 : 6 }}>
              <Box
                className="overflow-hidden rounded-lg"
                sx={{ aspectRatio: '4/3' }}
              >
                <Image
                  src={imageUrl}
                  alt={`Forum post bilde ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  quality={75}
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
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
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
  
  // Determine card styling based on post type - more colorful and vibrant
  const getCardStyling = () => {
    if (isThread) {
      return {
        backgroundColor: 'primary.100',
        borderLeft: '4px solid',
        borderLeftColor: 'primary.dark',
        elevation: 0
      };
    }
    return {
      backgroundColor: 'secondary.50',
      borderLeft: '3px solid',
      borderLeftColor: 'secondary.main',
      elevation: 0
    };
  };
  
  const cardStyle = getCardStyling();

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
          className
        )}
        elevation={cardStyle.elevation}
        sx={{ 
          borderRadius: 1,
          backgroundColor: cardStyle.backgroundColor,
          borderLeft: cardStyle.borderLeft,
          borderLeftColor: cardStyle.borderLeftColor,
          border: '1px solid',
          borderColor: 'grey.200',
          ...(level > 0 && {
            marginLeft: level * 2,
            borderLeftColor: 'secondary.main'
          })
        }}
      >
        <CardContent className="p-0">
          {/* Colored header bar for thread/post identification */}
          <Box
            sx={{
              backgroundColor: isThread ? 'primary.200' : 'secondary.100',
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              py: 1.5
            }}
          >
            {/* Header with author info and post time */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="flex-start"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar 
                  src={undefined}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    backgroundColor: isThread ? 'primary.main' : 'secondary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}
                >
                  {getUserInitials(post.author)}
                </Avatar>
                
                <Stack spacing={0.25}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography className="text-sm font-medium text-gray-800">
                      {getUserDisplayName(post.author)}
                    </Typography>
                    
                    {isThread && (
                      <Chip 
                        label="OP" 
                        size="small" 
                        sx={{ 
                          height: 16, 
                          fontSize: '0.6rem',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          fontWeight: 'bold',
                          px: 0.5
                        }}
                      />
                    )}
                  </Stack>
                  
                  <Typography className="text-xs text-gray-500">
                    {formatTimeAgo(post.createdAt)}
                    {isEdited && <span> • redigert</span>}
                  </Typography>
                </Stack>
              </Stack>

              {/* Menu button */}
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ color: 'text.secondary' }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* Post content */}
          <Box sx={{ px: 2, py: 1.5 }}>
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
          <Box 
            sx={{ 
              px: 3, 
              py: 2, 
              backgroundColor: isThread ? 'primary.25' : 'grey.25',
              borderTop: 1,
              borderColor: 'divider'
            }}
          >
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
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'primary.50' }
                  }}
                >
                  <Reply fontSize="small" />
                  <Typography 
                    className="text-caption ml-1"
                    sx={{ color: 'primary.main' }}
                  >
                    Svar
                  </Typography>
                </IconButton>
              )}
            </Stack>
          </Box>
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
        {isOwner && [
          <MenuItem key="edit" onClick={handleEdit}>
            <Edit fontSize="small" className="mr-2" />
            Rediger
          </MenuItem>,
          <MenuItem key="delete" onClick={handleDeleteClick} className="text-red-600">
            <Delete fontSize="small" className="mr-2" />
            Slett
          </MenuItem>,
          <Divider key="divider" />
        ]}
        
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