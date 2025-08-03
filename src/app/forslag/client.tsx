'use client';

import { useSearchParams } from 'next/navigation';
import SuggestionForm from '@/components/organisms/SuggestionForm';

export function ForslagClient() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const initialType = typeParam === 'bug' ? 'bug' : typeParam === 'feature' ? 'feature' : undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
      <SuggestionForm initialType={initialType} />
    </div>
  );
}