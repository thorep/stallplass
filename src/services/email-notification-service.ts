import { prisma } from '@/services/prisma';
import { createServerClient } from '@supabase/ssr';
import { resend } from '@/lib/resend';
import { logger } from '@/lib/logger';

interface MessageNotificationParams {
  recipientId: string;
  senderName: string;
  messageContent: string;
  conversationId: string;
  stableName?: string;
}

export async function sendMessageNotificationEmail({
  recipientId,
  senderName,
  messageContent,
  conversationId,
  stableName
}: MessageNotificationParams): Promise<void> {
  try {
    // Check if recipient has email notifications enabled
    const recipient = await prisma.profiles.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        nickname: true,
        message_notification_email: true
      }
    });

    if (!recipient || !recipient.message_notification_email) {
      logger.info(`Skipping email notification for user ${recipientId} - notifications disabled`);
      return;
    }

    // Get recipient's email from Supabase auth
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    const { data: userData, error: authError } = await adminSupabase.auth.admin.getUserById(recipientId);
    
    if (authError || !userData?.user?.email) {
      logger.error('Failed to get user email:', authError);
      return;
    }

    const recipientEmail = userData.user.email;
    const recipientName = recipient.nickname || recipient.firstname || 'bruker';
    
    // Truncate message for preview
    const messagePreview = messageContent.length > 200 
      ? messageContent.substring(0, 200) + '...' 
      : messageContent;

    const conversationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conversations/${conversationId}`;
    const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profil`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ny melding på Stallplass</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #4f46e5;
              color: white;
              padding: 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 32px 24px;
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 16px;
            }
            .message-info {
              background-color: #f3f4f6;
              border-left: 4px solid #4f46e5;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .message-info p {
              margin: 8px 0;
            }
            .sender-name {
              font-weight: 600;
              color: #4f46e5;
            }
            .message-preview {
              font-style: italic;
              color: #6b7280;
              margin-top: 12px;
              padding: 12px;
              background-color: #ffffff;
              border-radius: 4px;
            }
            .cta-button {
              display: inline-block;
              background-color: #4f46e5;
              color: white !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 24px 0;
            }
            .cta-button:hover {
              background-color: #4338ca;
            }
            .footer {
              padding: 20px 24px;
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
            .footer a {
              color: #4f46e5;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .divider {
              margin: 16px 0;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Stallplass.no</h1>
            </div>
            <div class="content">
              <p class="greeting">Hei ${recipientName}!</p>
              
              <p>Du har mottatt en ny melding på Stallplass.</p>
              
              <div class="message-info">
                <p><strong>Fra:</strong> <span class="sender-name">${senderName}</span></p>
                ${stableName ? `<p><strong>Angående:</strong> ${stableName}</p>` : ''}
                <div class="message-preview">
                  "${messagePreview}"
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${conversationUrl}" class="cta-button">Les meldingen</a>
              </div>
              
              <div class="divider"></div>
              
              <p style="font-size: 14px; color: #6b7280;">
                Svar direkte i meldingssystemet på Stallplass for å fortsette samtalen.
              </p>
            </div>
            <div class="footer">
              <p>Du mottar denne e-posten fordi du har aktivert meldingsvarsler.</p>
              <p>
                <a href="${settingsUrl}">
                  Administrer e-postinnstillinger
                </a>
              </p>
              <p style="margin-top: 16px; font-size: 12px;">
                © ${new Date().getFullYear()} Stallplass.no. Alle rettigheter forbeholdt.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: sendError } = await resend.emails.send({
      from: 'Stallplass <noreply@stallplass.no>',
      to: recipientEmail,
      subject: `Ny melding fra ${senderName} på Stallplass`,
      html: htmlContent,
    });
    
    if (sendError) {
      logger.error('Failed to send message notification email:', sendError);
    } else {
      logger.info(`Message notification email sent to ${recipientEmail}`);
    }
  } catch (error) {
    logger.error('Error in sendMessageNotificationEmail:', error);
  }
}