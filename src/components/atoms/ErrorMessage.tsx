'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  error: Error | null;
  message?: string;
  className?: string;
}

export default function ErrorMessage({ error, message, className = '' }: ErrorMessageProps) {
  if (!error && !message) return null;

  const displayMessage = message || error?.message || 'En feil oppstod';

  return (
    <div className={`flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200 ${className}`}>
      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
      <span>{displayMessage}</span>
    </div>
  );
}