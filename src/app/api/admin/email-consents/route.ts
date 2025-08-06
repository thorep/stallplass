import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { getEmailConsents } from '@/services/admin-service';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/admin/email-consents:
 *   get:
 *     summary: Get all emails that have consented to marketing (Admin only)
 *     description: Retrieves all user emails that have opted in to receive marketing emails
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Response format (json or csv)
 *         required: false
 *         default: json
 *     responses:
 *       200:
 *         description: Email consents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Profile ID
 *                       email:
 *                         type: string
 *                         description: User's email address
 *                       nickname:
 *                         type: string
 *                         description: User's nickname/display name
 *                       firstname:
 *                         type: string
 *                         nullable: true
 *                         description: User's first name
 *                       lastname:
 *                         type: string
 *                         nullable: true
 *                         description: User's last name
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Profile creation date
 *                 totalCount:
 *                   type: number
 *                   description: Total number of users who have consented
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV format with email,nickname,firstname,lastname,createdAt columns
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const emailConsents = await getEmailConsents();

    if (format === 'csv') {
      // Generate CSV format
      const headers = ['email', 'nickname', 'firstname', 'lastname', 'createdAt'];
      const csvRows = [
        headers.join(','),
        ...emailConsents.emails.map(user => [
          user.email,
          user.nickname || '',
          user.firstname || '',
          user.lastname || '',
          user.createdAt
        ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="email-consents-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json(emailConsents);
  } catch (error) {
    logger.error('Failed to fetch email consents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email consents' },
      { status: 500 }
    );
  }
}