'use client';

import { useState } from 'react';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useGetFAQsByStable, usePostFAQ, usePutFAQ, useDeleteFAQ } from '@/hooks/useFAQs';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface FAQManagementModalProps {
  stableId: string;
  stableName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FAQManagementModal({ 
  stableId, 
  stableName, 
  isOpen, 
  onClose 
}: FAQManagementModalProps) {
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Hooks
  const { data: faqs = [], isLoading } = useGetFAQsByStable(stableId);
  const createFAQ = usePostFAQ(stableId);
  const updateFAQ = usePutFAQ(stableId, editingFAQ?.id || '');
  const deleteFAQ = useDeleteFAQ(stableId);

  const handleCreateFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;
    
    try {
      await createFAQ.mutateAsync(newFAQ);
      setNewFAQ({ question: '', answer: '' });
      setIsAddingNew(false);
      toast.success('Spørsmål lagt til!');
    } catch {
      toast.error('Kunne ikke legge til spørsmål. Prøv igjen.');
    }
  };

  const handleUpdateFAQ = async () => {
    if (!editingFAQ) return;
    
    try {
      await updateFAQ.mutateAsync({
        question: editingFAQ.question,
        answer: editingFAQ.answer
      });
      setEditingFAQ(null);
      toast.success('Spørsmål oppdatert!');
    } catch {
      toast.error('Kunne ikke oppdatere spørsmål. Prøv igjen.');
    }
  };

  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette spørsmålet?')) return;
    
    try {
      await deleteFAQ.mutateAsync(faqId);
      toast.success('Spørsmål slettet!');
    } catch {
      toast.error('Kunne ikke slette spørsmål. Prøv igjen.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <QuestionMarkCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#5B4B8A]" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">FAQ for {stableName}</h2>
              <p className="text-xs sm:text-sm text-slate-600">Administrer ofte stilte spørsmål</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Add New FAQ Button */}
          <div className="mb-4 sm:mb-6">
            <Button
              variant="default"
              onClick={() => setIsAddingNew(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              disabled={isAddingNew}
            >
              <PlusIcon className="h-4 w-4" />
              Legg til nytt spørsmål
            </Button>
          </div>

          {/* Add New FAQ Form */}
          {isAddingNew && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Nytt spørsmål</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Spørsmål
                  </label>
                  <input
                    type="text"
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                    placeholder="Skriv inn spørsmålet..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    data-cy="faq-question-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Svar
                  </label>
                  <textarea
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                    placeholder="Skriv inn svaret..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    data-cy="faq-answer-textarea"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="default"
                    onClick={handleCreateFAQ}
                    disabled={createFAQ.isPending || !newFAQ.question.trim() || !newFAQ.answer.trim()}
                    className="w-full sm:w-auto"
                    data-cy="save-faq-button"
                  >
                    {createFAQ.isPending ? 'Oppretter...' : 'Opprett'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewFAQ({ question: '', answer: '' });
                    }}
                    className="w-full sm:w-auto"
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* FAQ List */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">
              Laster FAQs...
            </div>
          ) : faqs.length === 0 ? (
            <div className="bg-slate-50 rounded-lg p-8 text-center">
              <QuestionMarkCircleIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Ingen FAQs ennå</h3>
              <p className="text-slate-600">
                Legg til ditt første spørsmål og svar for å komme i gang.
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-cy="faq-list">
              {faqs.map((faq: FAQ) => (
                <div key={faq.id} className="bg-white border border-slate-200 rounded-lg p-4">
                  {editingFAQ?.id === faq.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Spørsmål
                        </label>
                        <input
                          type="text"
                          value={editingFAQ.question}
                          onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Svar
                        </label>
                        <textarea
                          value={editingFAQ.answer}
                          onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleUpdateFAQ}
                          disabled={updateFAQ.isPending}
                          className="w-full sm:w-auto"
                          data-cy="faq-update-button"
                        >
                          {updateFAQ.isPending ? 'Oppdaterer...' : 'Oppdater'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFAQ(null)}
                          className="w-full sm:w-auto"
                        >
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="font-medium text-slate-900 flex-1">
                          {faq.question}
                        </h4>
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFAQ(faq)}
                            className="p-2"
                            data-cy="faq-edit-button"
                          >
                            <PencilIcon className="h-4 w-4 sm:h-3 sm:w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFAQ(faq.id)}
                            className="text-red-600 hover:text-red-700 p-2"
                            data-cy="faq-delete-button"
                          >
                            <TrashIcon className="h-4 w-4 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Lukk
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
