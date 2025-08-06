import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/supabase-auth-middleware';
import { sendMarketingEmail } from '@/services/email-marketing-service';

export const GET = withAdminAuth(async () => {
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
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
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
    return NextResponse.json(
      { error: 'Failed to send marketing email' },
      { status: 500 }
    );
  }
});