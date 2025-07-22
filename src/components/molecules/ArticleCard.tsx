'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Tables } from '@/types/supabase';

type StableArticle = Tables<'stable_articles'>;
import { Calendar, Eye, Star } from 'lucide-react';

interface ArticleCardProps {
  article: StableArticle;
  stableId: string;
  showStableName?: boolean;
  stableName?: string;
  className?: string;
}

export function ArticleCard({ 
  article, 
  stableId, 
  showStableName = false, 
  stableName,
  className = '' 
}: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link 
      href={`/staller/${stableId}/artikler/${article.slug}`}
      className={`block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Cover Image */}
      {article.cover_image && (
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            className="object-cover"
          />
          {article.featured && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Fremhevet
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* Stable Name */}
        {showStableName && stableName && (
          <p className="text-sm text-primary font-medium mb-2">
            {stableName}
          </p>
        )}

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {article.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{article.tags.length - 3} til
              </span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {article.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(article.published_at)}
              </span>
            )}
            {article.view_count !== null && article.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.view_count}
              </span>
            )}
          </div>
          
          {!article.cover_image && article.featured && (
            <span className="inline-flex items-center px-2 py-1 bg-yellow-500 text-white rounded-full">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Fremhevet
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}