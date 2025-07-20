'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { StableFAQ } from '@/types/stable';

interface FAQManagerProps {
  stable_id: string;
  faqs: StableFAQ[];
  onChange: (faqs: StableFAQ[]) => void;
  title?: string;
}

export default function FAQManager({
  stable_id,
  faqs,
  onChange,
  title = "Ofte stilte spørsmål"
}: FAQManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ question: '', answer: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    
    if (!result.destination) return;

    const items = Array.from(faqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort order
    const reorderedFAQs = items.map((faq, index) => ({
      ...faq,
      sort_order: index
    }));

    onChange(reorderedFAQs);
  };

  // Start editing
  const startEditing = (faq: StableFAQ) => {
    setEditingId(faq.id);
    setEditData({ question: faq.question, answer: faq.answer });
  };

  // Save edit
  const saveEdit = () => {
    if (!editingId) return;

    const updatedFAQs = faqs.map(faq =>
      faq.id === editingId 
        ? { ...faq, question: editData.question, answer: editData.answer }
        : faq
    );

    onChange(updatedFAQs);
    setEditingId(null);
    setEditData({ question: '', answer: '' });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ question: '', answer: '' });
  };

  // Add new FAQ
  const addFAQ = () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;

    const newFAQItem: StableFAQ = {
      id: `temp-${Date.now()}`, // Temporary ID, will be replaced by API
      stable_id,
      question: newFAQ.question,
      answer: newFAQ.answer,
      sort_order: faqs.length,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onChange([...faqs, newFAQItem]);
    setNewFAQ({ question: '', answer: '' });
    setShowAddForm(false);
  };

  // Delete FAQ
  const deleteFAQ = (id: string) => {
    const updatedFAQs = faqs.filter(faq => faq.id !== id);
    onChange(updatedFAQs);
  };

  // Move FAQ up/down (alternative to drag and drop for mobile)
  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === faqs.length - 1)
    ) {
      return;
    }

    const newFAQs = [...faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newFAQs[index], newFAQs[targetIndex]] = [newFAQs[targetIndex], newFAQs[index]];
    
    // Update sort order
    const reorderedFAQs = newFAQs.map((faq, idx) => ({
      ...faq,
      sort_order: idx
    }));

    onChange(reorderedFAQs);
  };

  // Toggle active status
  const toggleActive = (id: string) => {
    const updatedFAQs = faqs.map(faq =>
      faq.id === id ? { ...faq, is_active: !faq.is_active } : faq
    );
    onChange(updatedFAQs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{faqs.length} spørsmål</span>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Legg til</span>
          </Button>
        </div>
      </div>

      {/* Add New FAQ Form */}
      {showAddForm && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-md font-medium text-slate-900 mb-3">Legg til nytt spørsmål</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Spørsmål
              </label>
              <input
                type="text"
                value={newFAQ.question}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                placeholder="F.eks. Hvor mye koster det per måned?"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Svar
              </label>
              <textarea
                value={newFAQ.answer}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Skriv svaret her..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={addFAQ}
                disabled={!newFAQ.question.trim() || !newFAQ.answer.trim()}
              >
                <CheckIcon className="h-3 w-3" />
                Legg til
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewFAQ({ question: '', answer: '' });
                }}
              >
                <XMarkIcon className="h-3 w-3" />
                Avbryt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ List */}
      {faqs.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="faq-list">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-3 ${snapshot.isDraggingOver ? 'bg-slate-50 rounded-lg p-2' : ''}`}
              >
                {faqs.map((faq, index) => (
                  <Draggable key={faq.id} draggableId={faq.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm
                          ${snapshot.isDragging ? 'shadow-lg rotate-1 ring-2 ring-indigo-500' : ''}
                          ${!faq.is_active ? 'opacity-60' : ''}
                        `}
                      >
                        <div className="p-4">
                          {/* Header with controls */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div 
                                {...provided.dragHandleProps}
                                className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                              >
                                <Bars3Icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                Spørsmål {index + 1}
                              </span>
                              {!faq.is_active && (
                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                                  Skjult
                                </span>
                              )}
                            </div>
                            
                            {/* Mobile controls */}
                            <div className="flex items-center gap-1 sm:hidden">
                              <Button
                                variant="ghost"
                                size="xs"
                                type="button"
                                onClick={() => moveFAQ(index, 'up')}
                                disabled={index === 0}
                              >
                                <ChevronUpIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                type="button"
                                onClick={() => moveFAQ(index, 'down')}
                                disabled={index === faqs.length - 1}
                              >
                                <ChevronDownIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Content */}
                          {editingId === faq.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Spørsmål
                                </label>
                                <input
                                  type="text"
                                  value={editData.question}
                                  onChange={(e) => setEditData(prev => ({ ...prev, question: e.target.value }))}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Svar
                                </label>
                                <textarea
                                  value={editData.answer}
                                  onChange={(e) => setEditData(prev => ({ ...prev, answer: e.target.value }))}
                                  rows={3}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="xs"
                                  type="button"
                                  onClick={saveEdit}
                                >
                                  <CheckIcon className="h-3 w-3" />
                                  Lagre
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  type="button"
                                  onClick={cancelEdit}
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                  Avbryt
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium text-slate-900 text-sm">
                                  {faq.question}
                                </h4>
                              </div>
                              <div>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          {editingId !== faq.id && (
                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  type="button"
                                  onClick={() => toggleActive(faq.id)}
                                >
                                  {faq.is_active ? 'Skjul' : 'Vis'}
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  type="button"
                                  onClick={() => startEditing(faq)}
                                >
                                  <PencilIcon className="h-3 w-3" />
                                  <span className="hidden sm:inline ml-1">Rediger</span>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="xs"
                                  type="button"
                                  onClick={() => deleteFAQ(faq.id)}
                                >
                                  <TrashIcon className="h-3 w-3" />
                                  <span className="hidden sm:inline ml-1">Slett</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        // Empty state
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="text-slate-400">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Ingen spørsmål ennå</h3>
              <p className="text-slate-500 mb-4">
                Hjelp besøkende ved å legge til ofte stilte spørsmål om din stall
              </p>
              <Button
                variant="primary"
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Legg til første spørsmål
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Usage instructions */}
      {faqs.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 mb-2">Tips for FAQ:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span className="hidden sm:inline">Dra spørsmålene for å endre rekkefølge</span>
              <span className="sm:hidden">Bruk pil-knappene for å endre rekkefølge</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              Skjulte spørsmål vises ikke på stallsiden
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              Legg til vanlige spørsmål om priser, fasiliteter og regler
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}