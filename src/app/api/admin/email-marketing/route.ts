import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sendMarketingEmail } from '@/services/email-marketing-service';
import { getPostHogServer } from '@/lib/posthog-server';

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    // Get recipients with email consent
    const { getEmailMarketingRecipients } = await import('@/services/email-marketing-service');
    const recipients = await getEmailMarketingRecipients();
    
    return NextResponse.json({
      recipients,
      totalCount: recipients.length
    });
  } catch (error) {
    console.error('Error fetching email marketing recipients:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'admin_email_marketing_get' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const { subject, content } = await request.json();
    
    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }
    
    const result = await sendMarketingEmail({
      subject,
      content
    });
    
    return NextResponse.json({
      success: true,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      failedEmails: result.failedEmails
    });
  } catch (error) {
    console.error('Error sending marketing email:', error);
    try { const ph = getPostHogServer(); ph.captureException(error, undefined, { context: 'admin_email_marketing_post' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to send marketing email' },
      { status: 500 }
    );
  }
}
