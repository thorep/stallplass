import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

export function TypingIndicator({ userName, className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center space-x-2 px-4 py-2 ${className}`}>
      <span className="text-sm text-gray-500">
        {userName || 'Noen'} skriver
      </span>
      <div className="flex space-x-1">
        <span 
          className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full" 
          style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
        />
        <span 
          className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full" 
          style={{ animationDelay: '150ms', animationDuration: '1.4s' }}
        />
        <span 
          className="animate-bounce inline-block w-2 h-2 bg-gray-400 rounded-full" 
          style={{ animationDelay: '300ms', animationDuration: '1.4s' }}
        />
      </div>
    </div>
  );
}