import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPaymentStats } from '@/services/admin-service';
import { logger } from '@/lib/logger';
import { getPostHogServer } from '@/lib/posthog-server';
import { captureApiError } from '@/lib/posthog-capture';

/**
 * @swagger
 * /api/admin/stats/payments:
 *   get:
 *     summary: Get payment statistics (Admin only)
 *     description: Retrieves comprehensive statistics about payments, invoices, and revenue trends in the system
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   description: Total revenue from all payments
 *                 monthlyRevenue:
 *                   type: number
 *                   description: Revenue for the current month
 *                 totalInvoices:
 *                   type: number
 *                   description: Total number of invoices
 *                 paidInvoices:
 *                   type: number
 *                   description: Number of paid invoices
 *                 pendingInvoices:
 *                   type: number
 *                   description: Number of pending invoices
 *                 overdueInvoices:
 *                   type: number
 *                   description: Number of overdue invoices
 *                 averageInvoiceAmount:
 *                   type: number
 *                   description: Average invoice amount
 *                 recentPayments:
 *                   type: number
 *                   description: Number of payments in the last 30 days
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Admin access required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch payment statistics"
 */
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) return authResult;
    
    const stats = await getPaymentStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching payment statistics:', error);
    try { captureApiError({ error, context: 'admin_stats_payments_get', route: '/api/admin/stats/payments', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch payment statistics' },
      { status: 500 }
    );
  }
}
