'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { RichTextEditor } from '@/components/molecules/RichTextEditor';
import { StableArticle } from '@/services/article-service';
import { Save, Eye, EyeOff, Star, StarOff } from 'lucide-react';

interface ArticleEditorProps {
  stableId: string;
  article?: StableArticle;
  onSave: (articleData: ArticleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  tags: string[];
  is_published: boolean;
  featured: boolean;
}

export function ArticleEditor({ stableId, article, onSave, onCancel, isLoading = false }: ArticleEditorProps) {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    excerpt: '',
    cover_image: '',
    tags: [],
    is_published: false,
    featured: false
  });
  
  const [tagInput, setTagInput] = useState('');

  // Initialize form with existing article data
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        cover_image: article.cover_image || '',
        tags: article.tags || [],
        is_published: article.is_published || false,
        featured: article.featured || false
      });
    }
  }, [article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Tittel *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Skriv inn artikkel tittel..."
            required
          />
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            Sammendrag
          </label>
          <textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Kort sammendrag av artikkelen (vises i forhåndsvisning)..."
          />
        </div>

        {/* Cover Image */}
        <div>
          <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-2">
            Forsidebilde URL
          </label>
          <input
            type="url"
            id="cover_image"
            value={formData.cover_image}
            onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="https://example.com/image.jpg"
          />
          {formData.cover_image && (
            <div className="mt-2">
              <img
                src={formData.cover_image}
                alt="Preview"
                className="max-w-xs h-32 object-cover rounded-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emner
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-primary text-white text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Legg til emne og trykk Enter..."
            />
            <Button
              type="button"
              onClick={addTag}
              variant="outline"
              disabled={!tagInput.trim()}
            >
              Legg til
            </Button>
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Innhold *
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            placeholder="Skriv artikkelens innhold her..."
            className="min-h-[400px]"
          />
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="flex items-center gap-1 text-sm text-gray-700">
              {formData.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Publiser artikkelen
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="flex items-center gap-1 text-sm text-gray-700">
              {formData.featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
              Fremhev artikkel
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Lagrer...' : article ? 'Oppdater artikkel' : 'Lagre artikkel'}
          </Button>
        </div>
      </form>
    </div>
  );
}