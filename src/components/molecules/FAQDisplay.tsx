'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { StableFAQ } from '@/types/stable';

interface FAQDisplayProps {
  faqs: StableFAQ[];
  title?: string;
}

export default function FAQDisplay({ faqs, title = "Ofte stilte spørsmål" }: FAQDisplayProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (faqId: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  // Only show active FAQs, sorted by sort_order
  const activeFAQs = faqs
    .filter(faq => faq.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (activeFAQs.length === 0) {
    return null; // Don't render if no active FAQs
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      
      <div className="space-y-4">
        {activeFAQs.map((faq) => {
          const isOpen = openItems.has(faq.id);
          
          return (
            <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
              >
                <h3 className="text-lg font-medium text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {isOpen && (
                <div className="px-6 py-4 bg-white border-t border-gray-200">
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Helpful note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">💡 Har du andre spørsmål?</span> Send melding til stallen via meldingsknappen på stallboksene.
        </p>
      </div>
    </div>
  );
}