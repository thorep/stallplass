import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const faqId = resolvedParams.faqId;

    // Verify user owns this stable
    const { data: stable, error: stableError } = await supabaseServer
      .from('stables')
      .select('owner_id')
      .eq('id', stableId)
      .single();

    if (stableError || !stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    if (stable.owner_id !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify FAQ belongs to this stable
    const { data: faq, error: faqError } = await supabaseServer
      .from('stable_faqs')
      .select('stable_id')
      .eq('id', faqId)
      .single();

    if (faqError || !faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    if (faq.stable_id !== stableId) {
      return NextResponse.json({ error: 'FAQ does not belong to this stable' }, { status: 403 });
    }

    // Delete FAQ
    const { error: deleteError } = await supabaseServer
      .from('stable_faqs')
      .delete()
      .eq('id', faqId);

    if (deleteError) {
      console.error('Error deleting FAQ:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete FAQ' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}