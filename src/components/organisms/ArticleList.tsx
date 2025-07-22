'use client';

import { useState } from 'react';
import { Tables } from '@/types/supabase';

type StableArticle = Tables<'stable_articles'>;
import { ArticleCard } from '@/components/molecules/ArticleCard';
import Button from '@/components/atoms/Button';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface ArticleListProps {
  stableId: string;
  stableName?: string;
  articles: StableArticle[];
  isOwner?: boolean;
  onCreateNew?: () => void;
  onEdit?: (article: StableArticle) => void;
  onDelete?: (articleId: string) => void;
  onTogglePublish?: (articleId: string, isPublished: boolean) => void;
  isLoading?: boolean;
}

export function ArticleList({ 
  stableId, 
  stableName,
  articles,
  isOwner = false,
  onCreateNew,
  onEdit,
  onDelete,
  onTogglePublish,
  isLoading = false 
}: ArticleListProps) {
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredArticles = articles.filter(article => {
    if (filter === 'published') return article.is_published;
    if (filter === 'draft') return !article.is_published;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Artikler</h2>
          {stableName && (
            <p className="text-gray-600">fra {stableName}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filter buttons for owners */}
          {isOwner && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'all' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Alle ({articles.length})
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'published' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Publisert ({articles.filter(a => a.is_published).length})
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'draft' 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Utkast ({articles.filter(a => !a.is_published).length})
              </button>
            </div>
          )}

          {/* Create new button for owners */}
          {isOwner && onCreateNew && (
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Ny artikkel
            </Button>
          )}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div key={article.id} className="relative">
              <ArticleCard
                article={article}
                stableId={stableId}
                showStableName={false}
                className={!article.is_published && isOwner ? 'opacity-75 border-2 border-dashed border-yellow-300' : ''}
              />

              {/* Owner Actions */}
              {isOwner && (
                <div className="absolute top-2 left-2 flex gap-1">
                  {!article.is_published && (
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                      Utkast
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons for owners */}
              {isOwner && (onEdit || onDelete || onTogglePublish) && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onTogglePublish && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onTogglePublish(article.id, !article.is_published);
                      }}
                      className="p-1 bg-white shadow-md hover:shadow-lg"
                      title={article.is_published ? 'Skjul artikkel' : 'Publiser artikkel'}
                    >
                      {article.is_published ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  )}

                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onEdit(article);
                      }}
                      className="p-1 bg-white shadow-md hover:shadow-lg"
                      title="Rediger artikkel"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        if (confirm('Er du sikker på at du vil slette denne artikkelen?')) {
                          onDelete(article.id);
                        }
                      }}
                      className="p-1 bg-white shadow-md hover:shadow-lg text-red-600 hover:bg-red-50"
                      title="Slett artikkel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'published' ? 'Ingen publiserte artikler' :
             filter === 'draft' ? 'Ingen utkast' : 
             'Ingen artikler ennå'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isOwner 
              ? 'Del tips, erfaringer og historier med andre hestefrelste!'
              : 'Kom tilbake senere for å lese artikler fra denne stallen.'}
          </p>
          {isOwner && onCreateNew && (
            <Button onClick={onCreateNew} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Skriv din første artikkel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}