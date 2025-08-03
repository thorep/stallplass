'use client';

import Link from 'next/link';
import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackPillProps {
  className?: string;
}

export default function FeedbackPill({ className }: FeedbackPillProps) {
  return (
    <Link
      href="/forslag"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 text-gray-700 hover:text-gray-900 rounded-full text-sm font-medium transition-all duration-200 border border-gray-200/50",
        className
      )}
    >
      <MessageSquarePlus className="h-4 w-4" />
      <span className="hidden sm:inline">Meld feil eller forbedring</span>
      <span className="sm:hidden">Feedback</span>
    </Link>
  );
}