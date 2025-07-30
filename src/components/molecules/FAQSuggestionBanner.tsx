'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import FAQManagementModal from '@/components/organisms/FAQManagementModal';

interface FAQSuggestionBannerProps {
  stableId: string;
  stableName: string;
}

const FAQ_SUGGESTION_DISMISSED_KEY = 'faq-suggestion-dismissed';

export default function FAQSuggestionBanner({ stableId, stableName }: FAQSuggestionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start with true to prevent flash
  const [showFAQModal, setShowFAQModal] = useState(false);

  useEffect(() => {
    // Check if banner has been dismissed for this specific stable
    const dismissedStables = localStorage.getItem(FAQ_SUGGESTION_DISMISSED_KEY);
    const dismissedStableIds = dismissedStables ? JSON.parse(dismissedStables) : [];
    setIsDismissed(dismissedStableIds.includes(stableId));
  }, [stableId]);

  const handleDismiss = () => {
    // Add this stable ID to the dismissed list
    const dismissedStables = localStorage.getItem(FAQ_SUGGESTION_DISMISSED_KEY);
    const dismissedStableIds = dismissedStables ? JSON.parse(dismissedStables) : [];
    
    if (!dismissedStableIds.includes(stableId)) {
      dismissedStableIds.push(stableId);
      localStorage.setItem(FAQ_SUGGESTION_DISMISSED_KEY, JSON.stringify(dismissedStableIds));
    }
    
    setIsDismissed(true);
  };

  const handleAddFAQ = () => {
    setShowFAQModal(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mt-6 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <QuestionMarkCircleIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-900 mb-1">
              💡 Tips: Legg til ofte stilte spørsmål
            </h4>
            <p className="text-sm text-amber-800 mb-3">
              Hjelp potensielle leietakere ved å legge til vanlige spørsmål for <strong>{stableName}</strong>. 
              Dette reduserer meldinger og gir bedre informasjon om priser, fasiliteter og regler.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="xs"
                onClick={handleAddFAQ}
                className="bg-amber-600 hover:bg-amber-700 border-amber-600"
                data-cy="add-faq-button"
              >
                Legg til FAQ
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleDismiss}
                className="text-amber-700 hover:text-amber-800"
                data-cy="dismiss-faq-suggestion-button"
              >
                Ikke vis denne igjen
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md text-amber-500 hover:text-amber-600 hover:bg-amber-100 transition-colors"
            aria-label="Lukk tips"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
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