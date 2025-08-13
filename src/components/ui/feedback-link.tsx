'use client';

import Link from 'next/link';

interface FeedbackLinkProps {
  className?: string;
}

export function FeedbackLink({ className = '' }: FeedbackLinkProps) {
  return (
    <Link 
      href="https://www.stallplass.no/forum/kategori/feil-og-forbedringer"
      className={`text-sm text-gray-600 hover:text-gray-900 underline ${className}`}
    >
      Mangler det noe her?
    </Link>
  );
}