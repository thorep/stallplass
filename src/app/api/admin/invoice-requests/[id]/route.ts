import { NextRequest, NextResponse } from 'next/server';
import { updateInvoiceRequestStatus } from '@/services/invoice-service';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';

/**
 * @swagger
 * /api/admin/invoice-requests/{id}:
 *   patch:
 *     summary: Update invoice request status (Admin only)
 *     description: Updates the status of an invoice request and optionally adds admin notes or invoice number
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice request ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, SENT, PAID, CANCELLED]
 *                 description: New status for the invoice request
 *               adminNotes:
 *                 type: string
 *                 nullable: true
 *                 description: Optional admin notes about the status change
 *               invoiceNumber:
 *                 type: string
 *                 nullable: true
 *                 description: Invoice number when status is SENT or PAID
 *     responses:
 *       200:
 *         description: Invoice request status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceRequest:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Invoice request ID
 *                     status:
 *                       type: string
 *                       enum: [PENDING, SENT, PAID, CANCELLED]
 *                       description: Updated status
 *                     adminNotes:
 *                       type: string
 *                       nullable: true
 *                       description: Admin notes
 *                     invoiceNumber:
 *                       type: string
 *                       nullable: true
 *                       description: Invoice number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: When the request was last updated
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Status is required"
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
 *       404:
 *         description: Invoice request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invoice request not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update invoice request"
 */
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  { profileId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {

    const { status, adminNotes, invoiceNumber } = await request.json();
    const { id } = await params;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatedRequest = await updateInvoiceRequestStatus(
      id,
      status,
      adminNotes,
      invoiceNumber
    );

    return NextResponse.json({ invoiceRequest: updatedRequest });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update invoice request' },
      { status: 500 }
    );
  }
});