import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/services/prisma';
import { resend } from '@/lib/resend';
import fs from 'fs/promises';
import path from 'path';

/**
 * @swagger
 * /api/admin/send-unread-notifications:
 *   post:
 *     summary: Send email notifications for unread messages (Admin only)
 *     description: Manually triggers email notifications to users who have unread messages in their conversations. Identifies conversations with unread messages and sends consolidated email notifications to both stable owners and conversation initiators.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message notifications sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalRecipientsWithUnread:
 *                   type: number
 *                   description: Total number of users with unread messages
 *                 emailsSent:
 *                   type: number
 *                   description: Number of emails successfully sent
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         description: Recipient email address
 *                       success:
 *                         type: boolean
 *                         description: Whether the email was sent successfully
 *                       messageId:
 *                         type: string
 *                         description: Email service message ID (if successful)
 *                       unreadCount:
 *                         type: number
 *                         description: Number of unread messages for this recipient
 *                       conversationCount:
 *                         type: number
 *                         description: Number of conversations with unread messages
 *                       error:
 *                         type: string
 *                         description: Error message (if failed)
 *                   description: Detailed results for each email sent
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
 *                   example: "Failed to send notifications"
 */
export async function POST() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  try {
    // Get all conversations with unread messages
    const conversationsWithUnreadMessages = await prisma.conversations.findMany({
      where: {
        messages: {
          some: {
            isRead: false
          }
        }
      },
      include: {
        messages: {
          where: {
            isRead: false
          }
        },
        user: {
          select: {
            id: true,
            nickname: true,
            firstname: true,
            lastname: true
          }
        },
        stable: {
          select: {
            name: true,
            ownerId: true,
            profiles: {
              select: {
                id: true,
                nickname: true,
                firstname: true,
                lastname: true
              }
            }
          }
        },
        box: {
          select: {
            name: true,
            stables: {
              select: {
                name: true,
                ownerId: true,
                profiles: {
                  select: {
                    id: true,
                    nickname: true,
                    firstname: true,
                    lastname: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Group conversations by recipient (either the conversation initiator or the stable owner)
    const recipientMap = new Map<string, Array<{
      conversation: typeof conversationsWithUnreadMessages[0],
      unreadCount: number,
      recipientIsInitiator: boolean
    }>>();

    for (const conversation of conversationsWithUnreadMessages) {
      // Determine who should receive the notification
      const stableOwnerId = conversation.stable?.ownerId || conversation.box?.stables?.ownerId;
      
      // Count unread messages not sent by the recipient
      const unreadByInitiator = conversation.messages.filter(msg => 
        !msg.isRead && msg.senderId === conversation.userId
      ).length;
      
      const unreadByOwner = conversation.messages.filter(msg => 
        !msg.isRead && msg.senderId === stableOwnerId
      ).length;

      // Notify stable owner if they have unread messages
      if (stableOwnerId && unreadByInitiator > 0) {
        if (!recipientMap.has(stableOwnerId)) {
          recipientMap.set(stableOwnerId, []);
        }
        recipientMap.get(stableOwnerId)!.push({
          conversation,
          unreadCount: unreadByInitiator,
          recipientIsInitiator: false
        });
      }

      // Notify conversation initiator if they have unread messages
      if (unreadByOwner > 0 && conversation.userId) {
        if (!recipientMap.has(conversation.userId)) {
          recipientMap.set(conversation.userId, []);
        }
        recipientMap.get(conversation.userId)!.push({
          conversation,
          unreadCount: unreadByOwner,
          recipientIsInitiator: true
        });
      }
    }

    // Create admin client for auth operations (requires service role key)
    const { createServerClient } = await import('@supabase/ssr');
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin operations require service role
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    // Read email template
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'unread-messages-email.html');
    const emailTemplate = await fs.readFile(templatePath, 'utf-8');

    const results = [];

    for (const [recipientId, conversations] of recipientMap) {
      try {
        // Get recipient's profile
        const recipientProfile = await prisma.profiles.findUnique({
          where: { id: recipientId },
          select: {
            id: true,
            nickname: true,
            firstname: true,
            lastname: true
          }
        });

        if (!recipientProfile) continue;

        // Get user email from Supabase Auth using admin client
        const { data: authUser } = await adminSupabase.auth.admin.getUserById(recipientId);
        
        if (!authUser || !authUser.user?.email) {
          console.error(`No email found for user ${recipientId}`);
          continue;
        }

        const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

        // Build conversation list HTML
        const conversationsList = conversations
          .map(({ conversation, unreadCount, recipientIsInitiator }) => {
            let conversationName = '';
            
            if (recipientIsInitiator) {
              // Recipient initiated the conversation, so show stable/box name
              if (conversation.stable) {
                conversationName = conversation.stable.name;
              } else if (conversation.box) {
                conversationName = `${conversation.box.name} - ${conversation.box.stables.name}`;
              } else if (conversation.stableSnapshot) {
                const snapshot = conversation.stableSnapshot as { name?: string };
                conversationName = snapshot.name || 'Slettet stall';
              } else if (conversation.boxSnapshot) {
                const snapshot = conversation.boxSnapshot as { name?: string };
                conversationName = snapshot.name || 'Slettet boks';
              }
            } else {
              // Recipient is the stable owner, show initiator's name
              const initiator = conversation.user;
              if (initiator) {
                conversationName = initiator.nickname || 
                  `${initiator.firstname || ''} ${initiator.lastname || ''}`.trim() || 
                  'Ukjent bruker';
              } else {
                conversationName = 'Ukjent bruker';
              }
            }

            return `
              <div class="conversation-item">
                <div class="conversation-name">${conversationName}</div>
                <div class="unread-count">${unreadCount} ${unreadCount === 1 ? 'ulestt melding' : 'uleste meldinger'}</div>
              </div>
            `;
          })
          .join('');

        // Replace placeholders in template
        const userName = recipientProfile.nickname || recipientProfile.firstname || 'der';
        const messageText = totalUnreadCount === 1 ? 'melding' : 'meldinger';
        const conversationText = conversations.length === 1 ? 'samtale' : 'samtaler';
        
        const emailHtml = emailTemplate
          .replace(/{{userName}}/g, userName)
          .replace(/{{totalUnreadCount}}/g, totalUnreadCount.toString())
          .replace(/{{messageText}}/g, messageText)
          .replace(/{{conversationCount}}/g, conversations.length.toString())
          .replace(/{{conversationText}}/g, conversationText)
          .replace(/{{conversationsList}}/g, conversationsList)
          .replace(/{{loginUrl}}/g, `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.stallplass.no'}/dashboard`);

        // Send email
        const { data, error } = await resend.emails.send({
          from: 'Stallplass <noreply@stallplass.no>',
          to: authUser.user.email,
          subject: `Du har ${totalUnreadCount} ${messageText} på Stallplass`,
          html: emailHtml,
        });

        if (error) {
          console.error(`Failed to send email to ${authUser.user.email}:`, error);
          results.push({
            email: authUser.user.email,
            success: false,
            error: error.message
          });
        } else {
          results.push({
            email: authUser.user.email,
            success: true,
            messageId: data?.id,
            unreadCount: totalUnreadCount,
            conversationCount: conversations.length
          });
        }
      } catch (error) {
        console.error(`Error processing user ${recipientId}:`, error);
        results.push({
          userId: recipientId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalRecipientsWithUnread: recipientMap.size,
      emailsSent: results.filter(r => r.success).length,
      results
    });
  } catch (error) {
    console.error('Failed to send unread notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}