import { NextRequest, NextResponse } from 'next/server';
import { restoreStable, getStableById } from '@/services/stable-service';
import { requireAuth } from '@/lib/auth';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

/**
 * @swagger
 * /api/stables/{id}/restore:
 *   post:
 *     summary: Restore a deleted/archived stable
 *     description: Restores a previously deleted or archived stable. Only the stable owner can restore their stable.
 *     tags: [Stables]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stable ID
 *     responses:
 *       200:
 *         description: Stable restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stable restored successfully"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authentication required"
 *       403:
 *         description: Forbidden - Can only restore own stables
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Unauthorized - you can only restore your own stables"
 *       404:
 *         description: Stable not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Stable not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const params = await context.params;
    
    // First, check if the stable exists and if the user owns it (include archived)
    const stable = await getStableById(params.id, true);
    if (!stable) {
      return NextResponse.json(
        { error: 'Stable not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (stable.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only restore your own stables' },
        { status: 403 }
      );
    }
    
    await restoreStable(params.id);
    return NextResponse.json({ message: 'Stable restored successfully' });
  } catch (error) {
    try { const params = await context.params; captureApiError({ error, context: 'stable_restore_post', route: '/api/stables/[id]/restore', method: 'POST', stableId: params.id }); } catch {}
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore stable' },
      { status: 500 }
    );
  }
}
