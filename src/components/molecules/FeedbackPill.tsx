"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

interface FeedbackPillProps {
  className?: string;
}

function FeedbackPill({ className }: FeedbackPillProps) {
  return (
    <Link
      href="/forum/kategori/feil-og-forbedringer"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200 text-gray-700 hover:text-gray-900 rounded-full text-sm font-medium transition-all duration-200 border border-gray-200/50",
        className
      )}
    >
      {/* <MessageSquarePlus className="h-4 w-4" /> */}
      <span className="hidden sm:inline">Meld feil eller forbedring</span>
      <span className="sm:hidden">Feedback</span>
    </Link>
  );
}

// Export with React.memo for performance optimization
export default React.memo(FeedbackPill);
