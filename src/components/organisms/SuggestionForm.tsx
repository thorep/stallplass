'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import { usePostSuggestion } from '@/hooks/useSuggestions';
import { CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

export default function SuggestionForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    name: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const createSuggestion = usePostSuggestion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSuggestion.mutateAsync({
        type: 'feature',
        title: formData.title,
        description: formData.description,
        category: 'user-feedback'
      });

      setIsSubmitted(true);
      setFormData({ title: '', description: '', email: '', name: '' });
    } catch (err) {
      console.error('Error submitting suggestion:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Takk for ditt forslag!
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Vi har mottatt ditt forslag og vil vurdere det. Takk for at du hjelper oss 
          med å forbedre Stallplass.no!
        </p>
        <Button
          variant="primary"
          onClick={() => setIsSubmitted(false)}
        >
          Send inn nytt forslag
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
          <LightBulbIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Del ditt forslag med oss
          </h2>
          <p className="text-gray-600 text-sm">
            Alle felt merket med * er påkrevd
          </p>
        </div>
      </div>

      {createSuggestion.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{createSuggestion.error.message || 'Det oppstod en feil. Prøv igjen.'}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Tittel (valgfritt)
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="En kort beskrivelse av forslaget ditt"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Beskrivelse *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Beskriv ditt forslag i detalj. Hva ønsker du skal forbedres eller legges til?"
          required
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-vertical"
          maxLength={2000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description.length}/2000 tegn
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Navn (valgfritt)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ditt navn"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-post (valgfritt)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="din@epost.no"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
          <p className="text-sm text-gray-500 mt-1">
            Vi kontakter deg kun hvis vi trenger oppfølging
          </p>
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={createSuggestion.isPending || !formData.description.trim()}
          className="w-full sm:w-auto"
        >
          {createSuggestion.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sender...
            </>
          ) : (
            'Send inn forslag'
          )}
        </Button>
      </div>

      <ErrorMessage error={createSuggestion.error} />

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Personvern:</p>
        <p>
          Vi behandler dine opplysninger i henhold til våre retningslinjer for personvern. 
          Kontaktinformasjonen din brukes kun for å følge opp forslaget ditt hvis nødvendig.
        </p>
      </div>
    </form>
  );
}