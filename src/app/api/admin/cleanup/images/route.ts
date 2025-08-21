import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getUnusedArchivedImages } from '@/services/cleanup-service';
import { createApiLogger } from '@/lib/logger';
import { captureApiError } from '@/lib/posthog-capture';

/**
 * @swagger
 * /api/admin/cleanup/images:
 *   post:
 *     summary: Scan for unused archived images (Admin only)
 *     description: Scans for and identifies unused images from archived stables and boxes. Returns a detailed list of images that can be safely deleted.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Image cleanup scan completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Unused image scan completed successfully"
 *                 results:
 *                   type: object
 *                   properties:
 *                     unusedImagesCount:
 *                       type: number
 *                       description: Total number of unused images found
 *                     archivedStableImages:
 *                       type: number
 *                       description: Number of images from archived stables
 *                     archivedBoxImages:
 *                       type: number
 *                       description: Number of images from archived boxes
 *                     unusedImages:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Full list of unused image paths
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: When the scan was completed
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Preview unused archived images (Admin only)
 *     description: Gets a preview of archived stables and boxes with their image counts without actually scanning for unused images
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Image cleanup preview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 preview:
 *                   type: object
 *                   properties:
 *                     archivedStablesWithImages:
 *                       type: number
 *                       description: Number of archived stables that have images
 *                     totalStableImages:
 *                       type: number
 *                       description: Total number of images from archived stables
 *                     totalBoxImages:
 *                       type: number
 *                       description: Total number of images from archived boxes
 *                     totalImages:
 *                       type: number
 *                       description: Total number of images from archived content
 *                     stables:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stableId:
 *                             type: string
 *                           stableName:
 *                             type: string
 *                           stableImages:
 *                             type: number
 *                           boxImages:
 *                             type: number
 *                           totalImages:
 *                             type: number
 *                       description: Details of archived stables with images
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function POST() {
  try {
    // Verify admin access
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const results = await getUnusedArchivedImages();

    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup/images',
      method: 'POST',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.info({
      adminId: user.id,
      results: {
        unusedImagesCount: results.unusedImages.length,
        archivedStableImages: results.archivedStableImages,
        archivedBoxImages: results.archivedBoxImages
      }
    }, 'Image cleanup scan completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Unused image scan completed successfully',
      results: {
        unusedImagesCount: results.unusedImages.length,
        archivedStableImages: results.archivedStableImages,
        archivedBoxImages: results.archivedBoxImages,
        unusedImages: results.unusedImages, // Full list of unused images
        timestamp: results.timestamp
      }
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup/images',
      method: 'POST',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Image cleanup scan failed');
    
    try { captureApiError({ error, context: 'admin_cleanup_images_post', route: '/api/admin/cleanup/images', method: 'POST' }); } catch {}
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Verify admin access
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;

    // Preview what would be cleaned up without actually doing it
    const { prisma } = await import('@/services/prisma');
    
    const archivedStables = await prisma.stables.findMany({
      where: {
        archived: true
      },
      select: {
        id: true,
        name: true,
        images: true,
        boxes: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      }
    });

    let totalStableImages = 0;
    let totalBoxImages = 0;
    const previewData = [];

    for (const stable of archivedStables) {
      const stableImageCount = stable.images?.length || 0;
      let boxImageCount = 0;
      
      for (const box of stable.boxes) {
        boxImageCount += box.images?.length || 0;
      }

      totalStableImages += stableImageCount;
      totalBoxImages += boxImageCount;

      if (stableImageCount > 0 || boxImageCount > 0) {
        previewData.push({
          stableId: stable.id,
          stableName: stable.name,
          stableImages: stableImageCount,
          boxImages: boxImageCount,
          totalImages: stableImageCount + boxImageCount
        });
      }
    }

    return NextResponse.json({
      success: true,
      preview: {
        archivedStablesWithImages: previewData.length,
        totalStableImages,
        totalBoxImages,
        totalImages: totalStableImages + totalBoxImages,
        stables: previewData
      }
    });
  } catch (error) {
    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup/images',
      method: 'GET',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Failed to preview image cleanup');
    
    try { captureApiError({ error, context: 'admin_cleanup_images_get', route: '/api/admin/cleanup/images', method: 'GET' }); } catch {}
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
