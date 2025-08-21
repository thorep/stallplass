import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/services/prisma';
import { captureApiError } from '@/lib/posthog-capture';

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  try {
    // Get forum statistics
    const [totalThreads, totalPosts, totalCategories, activeUsersResult] = await Promise.all([
      // Count threads (posts with parentId = null)
      prisma.forum_posts.count({
        where: {
          parentId: null
        }
      }),
      
      // Count all posts (threads + replies)
      prisma.forum_posts.count(),
      
      // Count active categories
      prisma.forum_categories.count({
        where: {
          isActive: true
        }
      }),
      
      // Count users who have posted in the last 30 days
      prisma.forum_posts.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        },
        select: {
          authorId: true
        },
        distinct: ['authorId']
      })
    ]);

    const stats = {
      totalThreads,
      totalPosts,
      totalCategories,
      activeUsers: activeUsersResult.length
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching forum stats:', error);
    try { captureApiError({ error, context: 'admin_forum_stats_get', route: '/api/admin/forum/stats', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch forum statistics' },
      { status: 500 }
    );
  }
}
