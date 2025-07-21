import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: rental, error } = await supabaseServer
      .from('utleie')
      .select(`
        *,
        rider:brukere (
          id,
          name,
          email
        ),
        stable:staller (
          id,
          name,
          eier_navn,
          eier_id
        ),
        box:stallplasser (
          id,
          name,
          price
        ),
        conversation:samtaler (
          id,
          status
        )
      `)
      .eq('id', id)
      .or(`leietaker_id.eq.${userId},stable.eier_id.eq.${userId}`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching rental:', error);
      return NextResponse.json({ error: 'Error fetching rental' }, { status: 500 });
    }

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(rental);
  } catch (error) {
    console.error('Error fetching rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, status, endDate } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get rental and verify access
    const { data: rental, error: rentalError } = await supabaseServer
      .from('utleie')
      .select(`
        *,
        stable:staller (
          eier_id
        ),
        box:stallplasser (
          name
        )
      `)
      .eq('id', id)
      .or(`leietaker_id.eq.${userId},stable.eier_id.eq.${userId}`)
      .single();

    if (rentalError && rentalError.code !== 'PGRST116') {
      console.error('Error fetching rental for update:', rentalError);
      return NextResponse.json({ error: 'Error fetching rental' }, { status: 500 });
    }

    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found or access denied' },
        { status: 404 }
      );
    }

    // Update rental and box availability if ending rental
    // Using sequential operations for the rental ending process
    // First update the rental
    const { data: updatedRental, error: updateError } = await supabaseServer
      .from('utleie')
      .update({
        status: status || rental.status,
        slutt_dato: endDate ? new Date(endDate).toISOString() : rental.slutt_dato,
        oppdatert_dato: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating rental:', updateError);
      return NextResponse.json({ error: 'Error updating rental' }, { status: 500 });
    }

    // If rental is being ended, make box available again
    if (status === 'ENDED' || status === 'CANCELLED') {
      // Update box availability
      const { error: boxUpdateError } = await supabaseServer
        .from('stallplasser')
        .update({ er_tilgjengelig: true })
        .eq('id', rental.stallplass_id);

      if (boxUpdateError) {
        console.error('Error updating box availability:', boxUpdateError);
        // Don't return error here, continue with other updates
      }

      // Update conversation status
      const { error: conversationUpdateError } = await supabaseServer
        .from('conversations')
        .update({ 
          status: 'ARCHIVED',
          oppdatert_dato: new Date().toISOString()
        })
        .eq('id', rental.samtale_id);

      if (conversationUpdateError) {
        console.error('Error updating conversation:', conversationUpdateError);
        // Don't return error here, continue with other updates
      }

      // Create system message
      const isOwnerEnding = rental.stable?.eier_id === userId;
      const messageContent = isOwnerEnding
        ? `Leieforholdet for "${rental.box?.name}" er avsluttet av stalleier.`
        : `Du har avsluttet leieforholdet for "${rental.box?.name}".`;

      const { error: messageError } = await supabaseServer
        .from('messages')
        .insert({
          samtale_id: rental.samtale_id,
          avsender_id: userId,
          content: messageContent,
          message_type: 'SYSTEM',
          metadata: {
            rentalId: rental.id,
            endDate: updatedRental.slutt_dato,
            status: updatedRental.status
          }
        });

      if (messageError) {
        console.error('Error creating system message:', messageError);
        // Don't return error here, the main operation succeeded
      }
    }

    const result = updatedRental;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}