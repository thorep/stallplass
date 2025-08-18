import { prisma } from "../prisma";
import type {
  ForumCategory,
  ForumPost,
  CreateThreadInput,
  UpdateThreadInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateReplyInput,
  UpdateReplyInput,
  GetThreadsOptions,
  ForumReaction,
  ForumThread,
  ForumThreadWithReplies,
  TrendingThreadOptions,
  TrendingThread,
  RecentActivityOptions,
  RecentActivityItem,
  ForumSearchFilters,
  ForumSearchResult,
  ForumSearchResponse,
  ForumReactionSummary,
} from "@/types/forum";

// ============================================
// SECTION OPERATIONS (Admin only)
// ============================================

/**
 * Get all active forum sections with categories
 */
export async function getSections() {
  const sections = await prisma.forum_sections.findMany({
    where: { isActive: true },
    include: {
      categories: {
        where: { isActive: true },
        include: {
          _count: {
            select: {
              posts: {
                where: { parentId: null } // Only count threads, not replies
              }
            }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  });

  // Get reply counts and latest activity for each category
  const sectionsWithStats = await Promise.all(
    sections.map(async (section) => {
      const categoriesWithReplyCounts = await Promise.all(
        section.categories.map(async (category) => {
          const replyCount = await prisma.forum_posts.count({
            where: {
              categoryId: category.id,
              parentId: { not: null } // Count only replies
            }
          });

          // Get the latest thread or reply in this category
          const latestActivity = await prisma.forum_posts.findFirst({
            where: {
              categoryId: category.id
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              createdAt: true,
              parentId: true,
              author: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  nickname: true,
                }
              }
            }
          });

          // If latest activity is a reply, get the parent thread title
          let latestActivityInfo = null;
          if (latestActivity) {
            if (latestActivity.parentId) {
              // This is a reply, get the parent thread
              const parentThread = await prisma.forum_posts.findUnique({
                where: { id: latestActivity.parentId },
                select: {
                  id: true,
                  title: true
                }
              });
              
              latestActivityInfo = {
                id: latestActivity.parentId,
                title: parentThread?.title || 'Unknown Thread',
                createdAt: latestActivity.createdAt,
                author: latestActivity.author,
                isReply: true
              };
            } else {
              // This is a thread
              latestActivityInfo = {
                id: latestActivity.id,
                title: latestActivity.title || 'Untitled',
                createdAt: latestActivity.createdAt,
                author: latestActivity.author,
                isReply: false
              };
            }
          }

          return {
            ...category,
            _count: {
              ...category._count,
              replies: replyCount
            },
            latestActivity: latestActivityInfo
          };
        })
      );

      return {
        ...section,
        categories: categoriesWithReplyCounts
      };
    })
  );

  return sectionsWithStats;
}

/**
 * Create a new forum section (admin only)
 */
export async function createSection(data: {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}) {
  return await prisma.forum_sections.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      sortOrder: data.sortOrder ?? 0
    }
  });
}

/**
 * Update a forum section (admin only)
 */
export async function updateSection(id: string, data: {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return await prisma.forum_sections.update({
    where: { id },
    data
  });
}

/**
 * Delete a forum section (admin only)
 */
export async function deleteSection(id: string) {
  await prisma.forum_sections.update({
    where: { id },
    data: { isActive: false }
  });
}

// ============================================
// CATEGORY OPERATIONS (Admin only)
// ============================================

/**
 * Get all active forum categories
 */
export async function getCategories(): Promise<ForumCategory[]> {
  const categories = await prisma.forum_categories.findMany({
    where: { isActive: true },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ],
  });

  return categories;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
  const category = await prisma.forum_categories.findUnique({
    where: { slug },
  });

  if (!category) return null;

  return category;
}

/**
 * Create a new category (admin only)
 */
export async function createCategory(data: CreateCategoryInput): Promise<ForumCategory> {
  return await prisma.forum_categories.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      ...(data.sectionId && { sectionId: data.sectionId }),
    },
  });
}

/**
 * Update a category (admin only)
 */
export async function updateCategory(id: string, data: UpdateCategoryInput): Promise<ForumCategory> {
  return await prisma.forum_categories.update({
    where: { id },
    data,
  });
}

/**
 * Delete a category (admin only)
 */
export async function deleteCategory(id: string): Promise<void> {
  // Soft delete by marking as inactive
  await prisma.forum_categories.update({
    where: { id },
    data: { isActive: false },
  });
}

// ============================================
// THREAD OPERATIONS
// ============================================

/**
 * Get threads with pagination and filters
 */
export async function getThreads(options: GetThreadsOptions = {}): Promise<{
  threads: ForumThread[];
  total: number;
}> {
  const {
    categoryId,
    limit = 20,
    offset = 0,
    orderBy = 'latest',
    searchQuery,
  } = options;

  const where = {
    parentId: null, // Only threads, not replies
    title: { not: null }, // Ensure title is not null
  } as Record<string, unknown>;

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { content: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Determine ordering
  let orderByClause: Array<Record<string, string>> = [];
  if (orderBy === 'pinned') {
    orderByClause = [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ];
  } else if (orderBy === 'popular') {
    orderByClause = [
      { viewCount: 'desc' },
      { createdAt: 'desc' },
    ];
  } else {
    orderByClause = [{ createdAt: 'desc' }];
  }

  const [threads, total] = await Promise.all([
    prisma.forum_posts.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            nickname: true,
          },
        },
        category: true,
        reactions: true,
        tags: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: orderByClause,
      take: limit,
      skip: offset,
    }),
    prisma.forum_posts.count({ where }),
  ]);

  // Get last reply info for each thread
  const threadsWithLastReply = await Promise.all(
    threads.map(async (thread) => {
      const lastReply = await prisma.forum_posts.findFirst({
        where: { parentId: thread.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      return {
        ...thread,
        replyCount: thread._count.replies,
        lastReplyAt: lastReply?.createdAt,
      };
    })
  );

  return {
    threads: threadsWithLastReply as ForumThread[],
    total,
  };
}

/**
 * Get a single thread with all replies
 */
export async function getThreadById(id: string): Promise<ForumThreadWithReplies | null> {
  const thread = await prisma.forum_posts.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
      category: true,
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              nickname: true,
            },
          },
        },
      },
      tags: true,
      replies: {
        include: {
          author: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              nickname: true,
              },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  nickname: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!thread || thread.parentId !== null) {
    return null; // Not a thread
  }

  const replyCount = await prisma.forum_posts.count({
    where: { parentId: id },
  });

  const lastReply = await prisma.forum_posts.findFirst({
    where: { parentId: id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  return {
    ...thread,
    replyCount,
    lastReplyAt: lastReply?.createdAt,
  } as ForumThreadWithReplies;
}

/**
 * Create a new thread
 */
export async function createThread(userId: string, data: CreateThreadInput): Promise<ForumThread> {
  console.log('[FORUM SERVICE] createThread called with:', {
    userId,
    hasTitle: !!data.title,
    hasContent: !!data.content,
    categoryId: data.categoryId,
    hasTags: !!data.tags,
    tagCount: data.tags?.length || 0
  });

  try {
    // Validate that category exists
    console.log('[FORUM SERVICE] Checking if category exists:', data.categoryId);
    const categoryExists = await prisma.forum_categories.findFirst({
      where: { 
        id: data.categoryId,
        isActive: true
      },
      select: { id: true, name: true }
    });

    if (!categoryExists) {
      console.log('[FORUM SERVICE] Category not found or inactive:', data.categoryId);
      throw new Error("Category not found");
    }

    console.log('[FORUM SERVICE] Category found:', { id: categoryExists.id, name: categoryExists.name });

    console.log('[FORUM SERVICE] Creating thread in database...');
    const thread = await prisma.forum_posts.create({
      data: {
        title: data.title,
        content: data.content,
        contentType: 'html',
        images: data.images || [],
        authorId: userId,
        categoryId: data.categoryId,
        tags: data.tags ? {
          create: data.tags.map(tag => ({ name: tag })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            nickname: true,
          },
        },
        category: true,
        reactions: true,
        tags: true,
      },
    });

    console.log('[FORUM SERVICE] Thread created successfully:', { 
      id: thread.id, 
      title: thread.title,
      authorId: thread.authorId,
      categoryId: thread.categoryId 
    });

    return {
      ...thread,
      title: thread.title!, // We know title is not null for threads
      replyCount: 0,
      lastReplyAt: undefined,
    } as ForumThread;
  } catch (error) {
    console.error('[FORUM SERVICE] Error in createThread:', error);
    
    if (error instanceof Error) {
      console.error('[FORUM SERVICE] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Re-throw the error to be handled by the API route
    throw error;
  }
}

/**
 * Update a thread
 */
export async function updateThread(
  userId: string,
  threadId: string,
  data: UpdateThreadInput
): Promise<unknown> {
  // Check if user owns the thread or is admin
  const thread = await prisma.forum_posts.findUnique({
    where: { id: threadId },
    select: { authorId: true },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  // Check if user is admin
  const user = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (thread.authorId !== userId && !user?.isAdmin) {
    throw new Error('Not authorized to update this thread');
  }

  const updated = await prisma.forum_posts.update({
    where: { id: threadId },
    data: {
      title: data.title,
      content: data.content,
      images: data.images,
      categoryId: data.categoryId,
      isPinned: user?.isAdmin ? data.isPinned : undefined,
      isLocked: user?.isAdmin ? data.isLocked : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
      category: true,
      reactions: true,
      tags: true,
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });

  const lastReply = await prisma.forum_posts.findFirst({
    where: { parentId: threadId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  return {
    ...updated,
    replyCount: updated._count.replies,
    lastReplyAt: lastReply?.createdAt,
  };
}

/**
 * Delete a thread
 */
export async function deleteThread(userId: string, threadId: string): Promise<void> {
  const thread = await prisma.forum_posts.findUnique({
    where: { id: threadId },
    select: { authorId: true },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  // Check if user is admin
  const user = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (thread.authorId !== userId && !user?.isAdmin) {
    throw new Error('Not authorized to delete this thread');
  }

  // Delete thread and all replies (cascade)
  await prisma.forum_posts.delete({
    where: { id: threadId },
  });
}

/**
 * Increment view count for a thread
 */
export async function incrementViewCount(threadId: string): Promise<void> {
  await prisma.forum_posts.update({
    where: { id: threadId },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}

// ============================================
// REPLY OPERATIONS
// ============================================

/**
 * Create a reply to a thread
 */
export async function createReply(
  userId: string,
  threadId: string,
  data: CreateReplyInput
): Promise<ForumPost> {
  // Check if thread exists and is not locked
  const thread = await prisma.forum_posts.findUnique({
    where: { id: threadId },
    select: { isLocked: true, parentId: true },
  });

  if (!thread) {
    throw new Error('Thread not found');
  }

  if (thread.parentId !== null) {
    throw new Error('Cannot reply to a reply');
  }

  if (thread.isLocked) {
    throw new Error('Thread is locked');
  }

  const reply = await prisma.forum_posts.create({
    data: {
      content: data.content,
      contentType: data.contentType || 'html',
      images: data.images || [],
      authorId: userId,
      parentId: threadId,
    },
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
      reactions: true,
    },
  });

  return reply;
}

/**
 * Update a reply
 */
export async function updateReply(
  userId: string,
  replyId: string,
  data: UpdateReplyInput
): Promise<ForumPost> {
  const reply = await prisma.forum_posts.findUnique({
    where: { id: replyId },
    select: { authorId: true, parentId: true },
  });

  if (!reply) {
    throw new Error('Reply not found');
  }

  if (reply.parentId === null) {
    throw new Error('This is not a reply');
  }

  if (reply.authorId !== userId) {
    throw new Error('Not authorized to update this reply');
  }

  const updated = await prisma.forum_posts.update({
    where: { id: replyId },
    data: { 
      content: data.content,
      contentType: data.contentType,
      images: data.images,
    },
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
      reactions: true,
    },
  });

  return updated;
}

/**
 * Delete a reply
 */
export async function deleteReply(userId: string, replyId: string): Promise<void> {
  const reply = await prisma.forum_posts.findUnique({
    where: { id: replyId },
    select: { authorId: true, parentId: true },
  });

  if (!reply) {
    throw new Error('Reply not found');
  }

  if (reply.parentId === null) {
    throw new Error('This is not a reply');
  }

  // Check if user is admin
  const user = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (reply.authorId !== userId && !user?.isAdmin) {
    throw new Error('Not authorized to delete this reply');
  }

  await prisma.forum_posts.delete({
    where: { id: replyId },
  });
}

// ============================================
// REACTION OPERATIONS
// ============================================

/**
 * Add a reaction to a post
 */
export async function addReaction(
  userId: string,
  postId: string,
  type: string
): Promise<ForumReaction> {
  // Check if post exists
  const post = await prisma.forum_posts.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  // Upsert to handle duplicate reactions
  const reaction = await prisma.forum_reactions.upsert({
    where: {
      postId_userId_type: {
        postId,
        userId,
        type,
      },
    },
    update: {}, // No update needed
    create: {
      postId,
      userId,
      type,
    },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
    },
  });

  return reaction;
}

/**
 * Remove a reaction from a post
 */
export async function removeReaction(
  userId: string,
  postId: string,
  type: string
): Promise<void> {
  await prisma.forum_reactions.delete({
    where: {
      postId_userId_type: {
        postId,
        userId,
        type,
      },
    },
  }).catch(() => {
    // Ignore if reaction doesn't exist
  });
}

/**
 * Get all reactions for a post
 */
export async function getReactions(postId: string): Promise<ForumReaction[]> {
  const reactions = await prisma.forum_reactions.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reactions;
}

// ============================================
// TRENDING OPERATIONS
// ============================================

/**
 * Get trending forum threads based on recent activity
 */
export async function getTrendingThreads(options: TrendingThreadOptions = {}): Promise<TrendingThread[]> {
  const { limit = 10, days = 7 } = options;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Get threads with their activity metrics
  const threads = await prisma.forum_posts.findMany({
    where: {
      parentId: null, // Only threads
      title: { not: null }, // Ensure title is not null
      createdAt: { gte: cutoffDate }, // Only recent threads
    },
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
      category: true,
      reactions: {
        where: {
          createdAt: { gte: cutoffDate }, // Only recent reactions
        },
      },
      tags: true,
      _count: {
        select: {
          replies: {
            where: {
              createdAt: { gte: cutoffDate }, // Only recent replies
            },
          },
          reactions: {
            where: {
              createdAt: { gte: cutoffDate }, // Only recent reactions
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 3, // Get more to calculate trending scores
  });

  // Calculate trending scores for each thread
  const threadsWithScores = await Promise.all(
    threads.map(async (thread) => {
      const recentReplies = thread._count.replies;
      const recentReactions = thread._count.reactions;
      
      // Get total reply count for this thread
      const totalReplies = await prisma.forum_posts.count({
        where: { parentId: thread.id },
      });

      // Get last reply info
      const lastReply = await prisma.forum_posts.findFirst({
        where: { parentId: thread.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      // Calculate trending score based on:
      // - Recent replies (weighted heavily)
      // - Recent reactions (medium weight)
      // - View count (light weight)
      // - Recency bonus (newer posts get slight boost)
      const replyWeight = 3;
      const reactionWeight = 2;
      const viewWeight = 0.01;
      const recencyBonus = Math.max(0, 7 - Math.floor((Date.now() - thread.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      
      const trendingScore = 
        (recentReplies * replyWeight) +
        (recentReactions * reactionWeight) +
        (thread.viewCount * viewWeight) +
        recencyBonus;

      return {
        ...thread,
        replyCount: totalReplies,
        lastReplyAt: lastReply?.createdAt,
        trendingScore,
        recentReplies,
        recentReactions,
        reactions: thread.reactions, // Include the actual recent reactions
      } as TrendingThread;
    })
  );

  // Sort by trending score and take the requested limit
  return threadsWithScores
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
}

// ============================================
// RECENT ACTIVITY OPERATIONS
// ============================================

/**
 * Get recent forum activity (posts and replies)
 */
export async function getRecentActivity(options: RecentActivityOptions = {}): Promise<RecentActivityItem[]> {
  const { limit = 20, categoryId } = options;

  const whereCondition = categoryId ? { categoryId } : {};

  // Get recent threads
  const recentThreads = await prisma.forum_posts.findMany({
    where: {
      ...whereCondition,
      parentId: null, // Only threads
      title: { not: null },
    },
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
        },
      },
      _count: {
        select: {
          reactions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.ceil(limit / 2), // Get half from threads
  });

  // Get recent replies
  const recentReplies = await prisma.forum_posts.findMany({
    where: {
      parentId: { not: null }, // Only replies
      ...(categoryId && {
        parent: {
          categoryId: categoryId,
        },
      }),
    },
    include: {
      author: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          nickname: true,
        },
      },
      parent: {
        select: {
          id: true,
          title: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
      _count: {
        select: {
          reactions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.ceil(limit / 2), // Get half from replies
  });

  // Convert threads to RecentActivityItem format
  const threadActivity: RecentActivityItem[] = recentThreads.map(thread => ({
    id: thread.id,
    type: 'thread' as const,
    title: thread.title || 'Untitled',
    content: thread.content,
    author: thread.author,
    category: thread.category,
    createdAt: thread.createdAt,
    reactionCount: thread._count.reactions,
  }));

  // Convert replies to RecentActivityItem format
  const replyActivity: RecentActivityItem[] = recentReplies.map(reply => ({
    id: reply.id,
    type: 'reply' as const,
    content: reply.content,
    author: reply.author,
    category: reply.parent?.category || null,
    threadId: reply.parentId || undefined,
    threadTitle: reply.parent?.title || undefined,
    createdAt: reply.createdAt,
    reactionCount: reply._count.reactions,
  }));

  // Combine and sort by creation date
  const allActivity = [...threadActivity, ...replyActivity]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);

  return allActivity;
}

// ============================================
// SEARCH OPERATIONS
// ============================================

/**
 * Create excerpt from content with search highlights
 */
function createExcerpt(content: string, query?: string, maxLength = 200): string {
  // Remove HTML tags and normalize whitespace
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (!query || query.length === 0) {
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  }
  
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  if (searchTerms.length === 0) {
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  }
  
  const lowerContent = plainText.toLowerCase();
  
  // Find the first occurrence of any search term
  let bestStart = -1;
  for (const term of searchTerms) {
    const index = lowerContent.indexOf(term);
    if (index !== -1 && (bestStart === -1 || index < bestStart)) {
      bestStart = index;
    }
  }
  
  if (bestStart === -1) {
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  }
  
  // Create excerpt centered around the found term
  const start = Math.max(0, bestStart - 50);
  const end = Math.min(plainText.length, start + maxLength);
  const excerpt = plainText.substring(start, end);
  
  return (start > 0 ? '...' : '') + excerpt + (end < plainText.length ? '...' : '');
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(post: { 
  title?: string | null; 
  content: string; 
  parentId: string | null; 
  createdAt: Date 
}, query?: string): number {
  if (!query || query.length === 0) return 0;
  
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  if (searchTerms.length === 0) return 0;
  
  let score = 0;
  const title = post.title?.toLowerCase() || '';
  const content = post.content.toLowerCase();
  
  for (const term of searchTerms) {
    // Title matches get higher score (weight: 3)
    const titleMatches = (title.match(new RegExp(term, 'gi')) || []).length;
    score += titleMatches * 3;
    
    // Content matches get normal score (weight: 1)
    const contentMatches = (content.match(new RegExp(term, 'gi')) || []).length;
    score += contentMatches * 1;
  }
  
  // Boost score for threads vs replies
  if (post.parentId === null) {
    score *= 1.2;
  }
  
  // Recent posts get slight boost
  const daysSinceCreated = Math.floor((Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceCreated <= 7) {
    score *= 1.1;
  }
  
  return score;
}

/**
 * Search forum posts with comprehensive filtering
 */
export async function searchForumPosts(filters: ForumSearchFilters): Promise<ForumSearchResponse> {
  const {
    query,
    categories = [],
    author,
    hasImages = false,
    sortBy = 'relevance',
    limit = 20,
    offset = 0,
  } = filters;
  
  // Validate and sanitize inputs
  const sanitizedLimit = Math.min(Math.max(1, limit), 100);
  const sanitizedOffset = Math.max(0, offset);
  
  // Build WHERE clause with AND conditions
  const whereConditions: Record<string, unknown>[] = [];
  
  // Text search in title and content
  if (query && query.trim().length > 0) {
    const searchQuery = query.trim();
    whereConditions.push({
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
      ]
    });
  }
  
  // Category filter - search both direct category and parent thread category for replies
  if (categories.length > 0) {
    whereConditions.push({
      OR: [
        { categoryId: { in: categories } }, // Direct category match (threads)
        { 
          parent: {
            categoryId: { in: categories }
          }
        } // Parent thread category match (replies)
      ]
    });
  }
  
  // Author filter - search by nickname, firstname, or lastname
  if (author && author.trim().length > 0) {
    const authorQuery = author.trim();
    whereConditions.push({
      author: {
        OR: [
          { nickname: { contains: authorQuery, mode: 'insensitive' } },
          { firstname: { contains: authorQuery, mode: 'insensitive' } },
          { lastname: { contains: authorQuery, mode: 'insensitive' } },
        ],
      }
    });
  }
  
  // Images filter
  if (hasImages) {
    whereConditions.push({
      images: {
        isEmpty: false, // Has at least one image
      }
    });
  }
  
  // Combine all conditions with AND
  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
  
  // Define order by clause
  let orderBy: Record<string, string>[] = [];
  switch (sortBy) {
    case 'newest':
      orderBy = [{ createdAt: 'desc' }];
      break;
    case 'oldest':
      orderBy = [{ createdAt: 'asc' }];
      break;
    case 'most_replies':
      // We'll handle this after fetching since it requires counting replies
      orderBy = [{ createdAt: 'desc' }];
      break;
    case 'relevance':
    default:
      // For relevance, we'll calculate scores and sort in memory
      orderBy = [{ createdAt: 'desc' }];
      break;
  }
  
  // Fetch posts with all necessary includes
  const [posts, totalCount] = await Promise.all([
    prisma.forum_posts.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            nickname: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        reactions: {
          select: {
            type: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy,
      take: sortBy === 'most_replies' || sortBy === 'relevance' 
        ? Math.min(sanitizedLimit * 3, 300) // Get more for sorting
        : sanitizedLimit,
      skip: sortBy === 'most_replies' || sortBy === 'relevance' ? 0 : sanitizedOffset,
    }),
    prisma.forum_posts.count({ where }),
  ]);
  
  // Transform posts to search results
  let searchResults: ForumSearchResult[] = await Promise.all(
    posts.map(async (post) => {
      // Calculate reply count
      let replyCount = 0;
      if (post.parentId === null) {
        // This is a thread
        replyCount = post._count.replies;
      }
      
      // Create reaction summary
      const reactionCounts: Record<string, number> = {};
      post.reactions.forEach(reaction => {
        reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
      });
      
      const reactions: ForumReactionSummary[] = Object.entries(reactionCounts).map(([type, count]) => ({
        type,
        count,
      }));
      
      // Determine if post has images
      const hasImages = post.images.length > 0;
      
      const result: ForumSearchResult = {
        id: post.id,
        type: post.parentId === null ? 'thread' : 'reply',
        title: post.title || undefined,
        content: post.content,
        excerpt: createExcerpt(post.content, query),
        author: post.author,
        category: post.parentId === null ? post.category : post.parent?.category || null,
        threadId: post.parentId || undefined,
        threadTitle: post.parent?.title || undefined,
        createdAt: post.createdAt,
        hasImages,
        replyCount,
        reactions,
      };
      
      // Add relevance score if needed
      if (sortBy === 'relevance') {
        result.relevanceScore = calculateRelevanceScore(post, query);
      }
      
      return result;
    })
  );
  
  // Apply additional sorting if needed
  if (sortBy === 'relevance') {
    searchResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  } else if (sortBy === 'most_replies') {
    searchResults.sort((a, b) => b.replyCount - a.replyCount);
  }
  
  // Apply pagination for custom sorting
  if (sortBy === 'most_replies' || sortBy === 'relevance') {
    searchResults = searchResults.slice(sanitizedOffset, sanitizedOffset + sanitizedLimit);
  }
  
  return {
    results: searchResults,
    pagination: {
      total: totalCount,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
      hasMore: sanitizedOffset + sanitizedLimit < totalCount,
    },
  };
}