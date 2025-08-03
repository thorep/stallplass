'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import { usePostSuggestion } from '@/hooks/useSuggestions';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Lightbulb, Bug } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SuggestionFormProps {
  initialType?: 'feature' | 'bug';
}

export default function SuggestionForm({ initialType }: SuggestionFormProps) {
  const [type, setType] = useState<'feature' | 'bug'>(initialType || 'feature');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const createSuggestion = usePostSuggestion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSuggestion.mutateAsync({
        type,
        title: formData.title,
        description: formData.description,
      });

      setIsSubmitted(true);
      setFormData({ title: '', description: '' });
    } catch {
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
          Ditt forslag er registrert i vårt utviklingssystem. Vi vurderer alle 
          innsendte forslag og forbedringer. Takk for ditt bidrag!
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

  const getIcon = () => {
    if (type === 'bug') {
      return (
        <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
          <Bug className="h-6 w-6 text-white" />
        </div>
      );
    }
    return (
      <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
        <Lightbulb className="h-6 w-6 text-white" />
      </div>
    );
  };

  const getTitle = () => {
    if (type === 'bug') {
      return 'Rapporter feil eller problem';
    }
    return 'Del ditt forslag med oss';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {getIcon()}
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {getTitle()}
          </h2>
          <p className="text-gray-600 text-sm">
            Helt anonymt - ingen persondata samles inn
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          Type tilbakemelding *
        </label>
        <Select value={type} onValueChange={(value) => setType(value as 'feature' | 'bug')}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feature">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>Foreslå forbedring</span>
              </div>
            </SelectItem>
            <SelectItem value="bug">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                <span>Meld om feil eller problem</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
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
          placeholder={type === 'bug' ? 'F.eks: "Kan ikke laste opp bilder på mobil"' : 'F.eks: "Mulighet for å filtrere på pris"'}
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
          placeholder={type === 'bug' ? 'Beskriv problemet: Når oppstår det? Hvilken nettleser bruker du? Hva forventet du skulle skje?' : 'Beskriv forslaget ditt: Hvilken funksjon savner du? Hvordan ville dette gjøre Stallplass bedre?'}
          required
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-vertical"
          maxLength={2000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description.length}/2000 tegn
        </p>
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
            type === 'bug' ? 'Send inn feilrapport' : 'Send inn forslag'
          )}
        </Button>
      </div>

      <ErrorMessage error={createSuggestion.error} />

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 border border-blue-200/50">
        <p className="font-medium mb-2 flex items-center gap-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          Personvern og prosess
        </p>
        <p className="mb-2">
          Ditt forslag registreres anonymt i vårt GitHub-baserte utviklingssystem.
        </p>
        <p>
          <span className="font-medium">Garantert privat:</span> Vi samler ikke inn navn, e-post eller andre personopplysninger.
        </p>
      </div>
    </form>
  );
}