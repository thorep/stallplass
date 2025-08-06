'use client';

import { Dialog, DialogTitle, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  showCloseButton?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = false,
  showCloseButton = true 
}: ModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm':
        return '40rem'; // 640px
      case 'md':
        return '48rem'; // 768px
      case 'lg':
        return '64rem'; // 1024px
      case 'xl':
        return '80rem'; // 1280px
      default:
        return '64rem'; // default
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth={false}
      fullScreen={fullScreen}
      slotProps={{
        paper: {
          className: "bg-background text-foreground",
        }
      }}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'rgb(255, 255, 255)', // white background
          color: 'rgb(0, 0, 0)', // black text
          padding: 0,
          overflow: 'auto',
          // Desktop styles (when not fullScreen)
          ...(!fullScreen && {
            width: '90%',
            maxWidth: maxWidth === false ? '64rem' : getMaxWidth(),
            maxHeight: '90vh',
            borderRadius: '0.625rem', // rounded-lg
            border: '1px solid rgb(229, 231, 235)', // gray-200 border
          }),
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <div className="p-6">
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <DialogTitle 
                component="h2" 
                className="text-h2 p-0"
                sx={{ padding: 0 }}
              >
                {title}
              </DialogTitle>
            )}
            {showCloseButton && (
              <IconButton
                onClick={onClose}
                size="small"
                className={!title ? 'ml-auto' : ''}
                sx={{ 
                  color: 'rgb(156, 163, 175)', // gray-400
                  padding: '0.5rem',
                  '&:hover': {
                    backgroundColor: 'rgb(243, 244, 246)', // gray-100
                    color: 'rgb(75, 85, 99)', // gray-600
                  }
                }}
              >
                <X className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        )}
        
        <div>
          {children}
        </div>
      </div>
    </Dialog>
  );
}