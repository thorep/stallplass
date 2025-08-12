"use client";

import { cn } from "@/lib/utils";
import { Bug, Lightbulb, MessageSquarePlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Button Container */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Options Menu */}
        <div
          className={cn(
            "absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 origin-bottom-right",
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
          )}
        >
          <div className="p-2 min-w-[200px]">
            <Link
              href="/forum/kategori/feil-og-forbedringer"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Bug className="h-4 w-4 text-red-500" />
              <span>Meld feil</span>
            </Link>
            <Link
              href="/forum/kategori/feil-og-forbedringer"
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span>Foreslå forbedring</span>
            </Link>
          </div>
        </div>

        {/* Main Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "group relative h-14 w-14 bg-gradient-to-br from-indigo-500 to-emerald-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center",
            isOpen && "rotate-45"
          )}
          aria-label="Meld feil eller forbedring"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquarePlus className="h-6 w-6" />}
        </button>

        {/* Tooltip on hover (desktop only) */}
        {!isOpen && (
          <div className="hidden lg:block absolute bottom-0 right-16 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md whitespace-nowrap">
              Meld feil eller forbedring
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
