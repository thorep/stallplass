import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/supabase-auth-middleware';
import { getUnusedArchivedImages } from '@/services/cleanup-service';
import { logger, createApiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const results = await getUnusedArchivedImages();

    const apiLogger = createApiLogger({
      endpoint: '/api/admin/cleanup/images',
      method: 'POST',
      requestId: crypto.randomUUID()
    });
    
    apiLogger.info({
      adminId,
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
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminAccess(request);
    if (!adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

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
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}