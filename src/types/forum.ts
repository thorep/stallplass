// Forum-related TypeScript types

export interface ForumSection {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: ForumCategory[];
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  sectionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    posts: number;
    replies?: number;
  };
  latestActivity?: {
    id: string;
    title: string;
    createdAt: Date;
    author: {
      id: string;
      firstname: string | null;
      lastname: string | null;
      nickname: string | null;
    } | null; // author can be null if deleted
    isReply: boolean;
  } | null;
}

export interface ForumPost {
  id: string;
  title: string | null; // null for replies
  content: string;
  contentType: string;
  images: string[]; // Array of image URLs
  authorId: string | null; // nullable due to soft delete
  parentId: string | null; // null = thread, value = reply
  categoryId: string | null;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumThread extends ForumPost {
  title: string; // threads always have titles
  parentId: null; // threads have no parent
  author: {
    id: string;
    nickname: string | null;
    firstname?: string | null;
    lastname?: string | null;
  } | null; // author can be null if deleted
  category?: ForumCategory | null;
  tags: ForumTag[];
  reactions: ForumReaction[];
  _count?: {
    replies: number;
    reactions?: number;
  };
  replyCount: number;
  lastReplyAt?: Date;
  lastReply?: {
    createdAt: Date;
    author: {
      nickname: string | null;
    } | null; // author can be null if deleted
  };
}

export interface ForumReply extends ForumPost {
  title: null; // replies don't have titles
  parentId: string; // replies always have a parent thread
  author: {
    id: string;
    nickname: string | null;
    firstname?: string | null;
    lastname?: string | null;
  } | null; // author can be null if deleted
  reactions: ForumReaction[];
  _count?: {
    reactions?: number;
  };
}

export interface ForumThreadWithReplies extends ForumThread {
  replies: ForumReply[];
}

export interface ForumReaction {
  id: string;
  postId: string;
  userId: string | null; // nullable due to soft delete
  type: string;
  createdAt: Date;
  user?: {
    id: string;
    firstname: string | null;
    lastname: string | null;
    nickname: string | null;
  } | null; // user can be null if deleted
}

export interface ForumReactionSummary {
  type: string;
  count: number;
  userReacted?: boolean; // if current user has reacted with this type
}

export interface ForumTag {
  id: string;
  threadId: string;
  name: string;
}

// Request/Response types (aliases for service compatibility)
export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  sectionId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateThreadInput {
  title: string;
  content: string;
  contentType?: string;
  images?: string[];
  categoryId?: string;
  tags?: string[];
}

export interface UpdateThreadInput {
  title?: string;
  content?: string;
  contentType?: string;
  images?: string[];
  categoryId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
}

export interface CreateReplyInput {
  content: string;
  contentType?: string;
  images?: string[];
}

export interface UpdateReplyInput {
  content?: string;
  contentType?: string;
  images?: string[];
}

// Legacy aliases for backward compatibility
export type CreateCategoryData = CreateCategoryInput;
export type UpdateCategoryData = UpdateCategoryInput;
export type CreateThreadData = CreateThreadInput;
export type UpdateThreadData = UpdateThreadInput;
export type CreateReplyData = CreateReplyInput;
export type UpdateReplyData = UpdateReplyInput;

export interface GetThreadsOptions {
  categoryId?: string;
  limit?: number;
  offset?: number;
  page?: number;
  search?: string;
  orderBy?: 'latest' | 'pinned' | 'popular';
  searchQuery?: string;
}

// General update input for posts (threads or replies)
export interface UpdatePostInput {
  title?: string;
  content?: string;
  contentType?: string;
  images?: string[];
  categoryId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
}

export interface ReactionData {
  postId: string;
  type: 'like' | 'helpful' | 'thanks' | 'love' | 'laugh' | 'sad' | 'angry';
}

// API Response types
export interface ForumApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Trending and Activity types
export interface TrendingThreadOptions {
  limit?: number;
  days?: number; // Look back period in days (default: 7)
}

export interface TrendingThread extends ForumThread {
  trendingScore: number;
  recentReplies: number;
  recentReactions: number;
}

export interface RecentActivityOptions {
  limit?: number;
  categoryId?: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'thread' | 'reply';
  title?: string; // Only for threads
  content: string;
  author: {
    id: string;
    firstname: string | null;
    lastname: string | null;
    nickname: string | null;
  } | null; // author can be null if deleted
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  threadId?: string; // For replies, reference to parent thread
  threadTitle?: string; // For replies, title of parent thread
  createdAt: Date;
  reactionCount: number;
}

// Forum search types
export interface ForumSearchFilters {
  query?: string;
  categories?: string[];
  author?: string;
  hasImages?: boolean;
  sortBy?: 'relevance' | 'newest' | 'oldest' | 'most_replies';
  limit?: number;
  offset?: number;
}

export interface ForumSearchResult {
  id: string;
  type: 'thread' | 'reply';
  title?: string; // Only for threads
  content: string;
  excerpt: string; // Truncated content with search highlights
  author: {
    id: string;
    firstname: string | null;
    lastname: string | null;
    nickname: string | null;
  } | null; // author can be null if deleted
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  threadId?: string; // For replies, reference to parent thread
  threadTitle?: string; // For replies, title of parent thread
  createdAt: Date;
  hasImages: boolean;
  replyCount: number; // For threads: direct reply count, for replies: 0
  relevanceScore?: number; // Only used when sortBy is 'relevance'
  reactions: ForumReactionSummary[];
}

export interface ForumSearchResponse {
  results: ForumSearchResult[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}