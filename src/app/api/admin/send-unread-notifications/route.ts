import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';
import { prisma } from '@/services/prisma';
import { resend } from '@/lib/resend';
import fs from 'fs/promises';
import path from 'path';

export const POST = withAdminAuth(async () => {
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
      if (unreadByOwner > 0) {
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

    // Get email addresses from Supabase Auth
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

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

        // Get user email from Supabase Auth
        const { data: authUser } = await supabase.auth.admin.getUserById(recipientId);
        
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
              conversationName = initiator.nickname || 
                `${initiator.firstname || ''} ${initiator.lastname || ''}`.trim() || 
                'Ukjent bruker';
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
});