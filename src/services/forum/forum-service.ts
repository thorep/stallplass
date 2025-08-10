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
      sectionId: data.sectionId,
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
export async function createThread(userId: string, data: CreateThreadInput): Promise<unknown> {
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

  return {
    ...thread,
    replyCount: 0,
    lastReplyAt: undefined,
  };
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