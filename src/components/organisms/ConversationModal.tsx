'use client';

import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ConversationChat } from './ConversationChat';

interface ConversationModalProps {
  conversation: {
    id: string;
    stable: {
      id: string;
      name: string;
      images: string[];
      ownerId: string;
    } | null;
    box?: {
      id: string;
      name: string;
      price: number;
    } | null;
    // Snapshot data for deleted items
    stableSnapshot?: {
      name: string;
      deletedAt: string;
    };
    boxSnapshot?: {
      name: string;
      price: number;
      images?: string;
      deletedAt: string;
    };
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationModal({ 
  conversation, 
  isOpen, 
  onClose 
}: ConversationModalProps) {
  const { height: windowHeight } = useWindowSize();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  // Detect virtual keyboard on mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const heightDifference = window.screen.height - window.innerHeight;
        setIsKeyboardOpen(heightDifference > 200);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Adjust modal height for keyboard
  const modalHeight = isKeyboardOpen 
    ? `${windowHeight}px` 
    : 'auto';
  
  const maxHeight = isKeyboardOpen 
    ? `${windowHeight}px` 
    : '95vh';
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div 
        className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-4xl overflow-hidden flex flex-col"
        style={{ 
          height: isKeyboardOpen ? modalHeight : 'auto',
          maxHeight: isKeyboardOpen ? modalHeight : maxHeight
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0 bg-white">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Meldinger</h2>
            <p className="text-sm text-gray-600">
              {conversation.box 
                ? `${conversation.box.name} - ${conversation.stable?.name}`
                : conversation.stable?.name
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Lukk meldinger"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ConversationChat conversation={conversation} />
        </div>
      </div>
    </div>
  );
}