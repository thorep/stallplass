'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useGetFAQsByStable } from '@/hooks/useFAQs';
import FAQManagementModal from '@/components/organisms/FAQManagementModal';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface StableFAQDisplayProps {
  stableId: string;
  stableName: string;
}

export default function StableFAQDisplay({ stableId, stableName }: StableFAQDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const { data: faqs = [], isLoading } = useGetFAQsByStable(stableId);

  if (isLoading) {
    return (
      <div className="p-6 border-b border-slate-100">
        <div className="text-sm text-slate-500">Laster FAQs...</div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return null; // FAQ suggestion banner will show instead
  }

  return (
    <>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QuestionMarkCircleIcon className="h-5 w-5 text-slate-600" />
            <h4 className="text-lg font-semibold text-slate-900">
              FAQ ({faqs.length})
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFAQModal(true)}
              className="flex items-center gap-1"
              data-cy="manage-faq-button"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Administrer</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isExpanded ? 'Skjul' : 'Vis alle'}
              </span>
            </Button>
          </div>
        </div>

        {/* Preview - show first 2 FAQs when collapsed */}
        {!isExpanded && (
          <div className="space-y-3">
            {faqs.slice(0, 2).map((faq: FAQ) => (
              <div key={faq.id} className="bg-slate-50 rounded-lg p-3">
                <h5 className="font-medium text-slate-900 text-sm mb-1">
                  {faq.question}
                </h5>
                <p className="text-slate-600 text-xs line-clamp-2">
                  {faq.answer}
                </p>
              </div>
            ))}
            {faqs.length > 2 && (
              <div className="text-xs text-slate-500 text-center">
                +{faqs.length - 2} flere spørsmål
              </div>
            )}
          </div>
        )}

        {/* Full list when expanded */}
        {isExpanded && (
          <div className="space-y-3">
            {faqs.map((faq: FAQ) => (
              <div key={faq.id} className="bg-slate-50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full text-left p-3 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-slate-900 text-sm flex-1 pr-2">
                      {faq.question}
                    </h5>
                    {expandedFAQ === faq.id ? (
                      <ChevronDownIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-3 pb-3 border-t border-slate-200 bg-white">
                    <p className="text-slate-600 text-sm pt-3 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick tip */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <strong>Tips:</strong> Gode FAQs reduserer antall meldinger og gir bedre informasjon til potensielle leietakere.
          </p>
        </div>
      </div>

      <FAQManagementModal
        stableId={stableId}
        stableName={stableName}
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
    </>
  );
}