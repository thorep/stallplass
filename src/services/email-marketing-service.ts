import { prisma } from '@/services/prisma';
import { createServerClient } from '@supabase/ssr';
import { resend } from '@/lib/resend';

interface EmailRecipient {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  nickname: string | null;
}

interface SendEmailParams {
  subject: string;
  content: string;
}

interface SendEmailResult {
  sentCount: number;
  failedCount: number;
  failedEmails: string[];
}

// Get all users who have consented to email marketing
export async function getEmailMarketingRecipients(): Promise<EmailRecipient[]> {
  // Get profiles with email consent
  const profilesWithConsent = await prisma.profiles.findMany({
    where: {
      email_consent: true
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      nickname: true
    }
  });

  if (profilesWithConsent.length === 0) {
    return [];
  }

  // Get emails from Supabase auth for these profiles
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

  const { data: users, error } = await adminSupabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users from Supabase:', error);
    throw error;
  }

  // Map profile IDs to user emails
  const userEmailMap = new Map<string, string>();
  users.users.forEach(user => {
    if (user.email) {
      userEmailMap.set(user.id, user.email);
    }
  });

  // Combine profile data with emails
  const recipients: EmailRecipient[] = profilesWithConsent
    .map(profile => {
      const email = userEmailMap.get(profile.id);
      if (!email) return null;
      
      return {
        id: profile.id,
        email,
        firstname: profile.firstname,
        lastname: profile.lastname,
        nickname: profile.nickname
      };
    })
    .filter((recipient) => recipient !== null);

  return recipients;
}

// Send marketing email to all consented users
// Helper function to add delay between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendMarketingEmail({ subject, content }: SendEmailParams): Promise<SendEmailResult> {
  const recipients = await getEmailMarketingRecipients();
  
  if (recipients.length === 0) {
    return {
      sentCount: 0,
      failedCount: 0,
      failedEmails: []
    };
  }

  let sentCount = 0;
  let failedCount = 0;
  const failedEmails: string[] = [];

  // Send emails to all recipients with rate limiting
  // Resend allows 2 requests per second, so we'll send 1 per second to be safe
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${subject}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #4f46e5;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #ffffff;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-radius: 0 0 8px 8px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
              }
              .unsubscribe {
                color: #4f46e5;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Stallplass.no</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>Du mottar denne e-posten fordi du har samtykket til markedsføring fra Stallplass.no</p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/profil/innstillinger" class="unsubscribe">
                  Administrer e-postinnstillinger
                </a>
              </p>
            </div>
          </body>
        </html>
      `;

      const { error } = await resend.emails.send({
        from: 'Stallplass <noreply@stallplass.no>',
        to: recipient.email,
        subject: subject,
        html: htmlContent,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      sentCount++;
      console.log(`✅ Email sent to ${recipient.email} (${sentCount}/${recipients.length})`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${recipient.email}:`, error);
      failedCount++;
      failedEmails.push(recipient.email);
    }
    
    // Add delay between emails to respect rate limits (1 second delay = 1 req/sec)
    // Skip delay after the last email
    if (i < recipients.length - 1) {
      console.log(`⏳ Waiting 1 second before sending next email...`);
      await sleep(1000);
    }
  }

  return {
    sentCount,
    failedCount,
    failedEmails
  };
}