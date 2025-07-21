import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest} from '@/lib/supabase-auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const stableId = resolvedParams.id;

    const { data: faqs, error } = await supabaseServer
      .from('stall_ofte_spurte_sporsmal')
      .select('*')
      .eq('stall_id', stableId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch FAQs' },
        { status: 500 }
      );
    }

    return NextResponse.json(faqs || []);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const body = await request.json();
    const { question, answer, sortOrder } = body;

    // Verify user owns this stable
    const { data: stable, error: stableError } = await supabaseServer
      .from('staller')
      .select('eier_id')
      .eq('id', stableId)
      .single();

    if (stableError || !stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    if (stable.eier_id !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create FAQ
    const { data: faq, error: faqError } = await supabaseServer
      .from('stall_ofte_spurte_sporsmal')
      .insert({
        stable_id: stableId,
        sporsmal: question,
        svar: answer,
        sort_order: sortOrder ?? 0
      })
      .select()
      .single();

    if (faqError) {
      console.error('Error creating FAQ:', faqError);
      return NextResponse.json(
        { error: 'Failed to create FAQ' },
        { status: 500 }
      );
    }

    return NextResponse.json(faq);
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await authenticateRequest(request);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const stableId = resolvedParams.id;
    const body = await request.json();
    const { faqs } = body; // Array of FAQ updates

    // Verify user owns this stable
    const { data: stable, error: stableError } = await supabaseServer
      .from('staller')
      .select('eier_id')
      .eq('id', stableId)
      .single();

    if (stableError || !stable) {
      return NextResponse.json({ error: 'Stable not found' }, { status: 404 });
    }

    if (stable.eier_id !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update FAQs - handle each operation separately
    const updatedFAQs = [];

    for (const faq of faqs) {
      if (faq.id.startsWith('temp-')) {
        // Create new FAQ
        const { data: newFAQ, error: createError } = await supabaseServer
          .from('stall_ofte_spurte_sporsmal')
          .insert({
            stable_id: stableId,
            sporsmal: faq.question,
            svar: faq.answer,
            sort_order: faq.sortOrder,
            is_active: faq.isActive ?? true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating FAQ:', createError);
          return NextResponse.json(
            { error: 'Failed to create FAQ' },
            { status: 500 }
          );
        }
        updatedFAQs.push(newFAQ);
      } else {
        // Update existing FAQ
        const { data: updatedFAQ, error: updateError } = await supabaseServer
          .from('stall_ofte_spurte_sporsmal')
          .update({
            sporsmal: faq.question,
            svar: faq.answer,
            sort_order: faq.sortOrder,
            is_active: faq.isActive
          })
          .eq('id', faq.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating FAQ:', updateError);
          return NextResponse.json(
            { error: 'Failed to update FAQ' },
            { status: 500 }
          );
        }
        updatedFAQs.push(updatedFAQ);
      }
    }

    return NextResponse.json(updatedFAQs);
  } catch (error) {
    console.error('Error updating FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQs' },
      { status: 500 }
    );
  }
}