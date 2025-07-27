import { prisma } from './prisma';
import { suggestions } from '@/generated/prisma';

export interface CreateSuggestionData {
  title?: string;
  description: string;
  email?: string;
  name?: string;
}

export interface SuggestionWithDates extends suggestions {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new suggestion
 */
export async function createSuggestion(data: CreateSuggestionData): Promise<SuggestionWithDates> {
  try {
    const suggestion = await prisma.suggestions.create({
      data: {
        title: data.title || null,
        description: data.description,
        email: data.email || null,
        name: data.name || null,
      },
    });

    return suggestion;
  } catch (error) {
    console.error('Error creating suggestion:', error);
    throw new Error('Failed to create suggestion');
  }
}

/**
 * Get all suggestions (admin only)
 */
export async function getAllSuggestions(): Promise<SuggestionWithDates[]> {
  try {
    const suggestions = await prisma.suggestions.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return suggestions;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw new Error('Failed to fetch suggestions');
  }
}

/**
 * Mark suggestion as reviewed (admin only)
 */
export async function markSuggestionReviewed(
  id: string, 
  response?: string
): Promise<SuggestionWithDates> {
  try {
    const suggestion = await prisma.suggestions.update({
      where: { id },
      data: {
        isReviewed: true,
        response: response || null,
      },
    });

    return suggestion;
  } catch (error) {
    console.error('Error updating suggestion:', error);
    throw new Error('Failed to update suggestion');
  }
}

/**
 * Get suggestion statistics
 */
export async function getSuggestionStats(): Promise<{
  total: number;
  reviewed: number;
  pending: number;
}> {
  try {
    const [total, reviewed] = await Promise.all([
      prisma.suggestions.count(),
      prisma.suggestions.count({
        where: { isReviewed: true }
      })
    ]);

    return {
      total,
      reviewed,
      pending: total - reviewed,
    };
  } catch (error) {
    console.error('Error fetching suggestion stats:', error);
    throw new Error('Failed to fetch suggestion statistics');
  }
}