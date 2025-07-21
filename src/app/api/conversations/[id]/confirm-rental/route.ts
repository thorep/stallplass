import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { userId, startDate, endDate, monthlyPrice } = body;

    if (!userId || !startDate) {
      return NextResponse.json(
        { error: 'User ID and start date are required' },
        { status: 400 }
      );
    }

    // Get conversation and verify access
    const { data: conversation, error: conversationError } = await supabaseServer
      .from('samtaler')
      .select(`
        *,
        stallplass:stallplasser (*),
        stall:staller (eier_id),
        leietaker:brukere!samtaler_leietaker_id_fkey (
          id,
          name
        )
      `)
      .eq('id', conversationId)
      .or(`leietaker_id.eq.${userId},stall.eier_id.eq.${userId}`)
      .single();

    if (conversationError) {
      console.error('Error fetching conversation:', conversationError);
      throw conversationError;
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    if (!conversation.stallplass_id) {
      return NextResponse.json(
        { error: 'No box associated with this conversation' },
        { status: 400 }
      );
    }

    // Check if rental already exists
    const { data: existingRental, error: rentalError } = await supabaseServer
      .from('utleie')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (rentalError && rentalError.code !== 'PGRST116') {
      console.error('Error checking existing rental:', rentalError);
      throw rentalError;
    }

    if (existingRental) {
      return NextResponse.json(
        { error: 'Rental already confirmed for this conversation' },
        { status: 400 }
      );
    }

    // Create rental and update box availability
    // Using sequential operations for the rental confirmation process
    // Create rental first
    const { data: rental, error: rentalCreateError } = await supabaseServer
      .from('utleie')
      .insert({
        samtale_id: conversationId,
        leietaker_id: conversation.leietaker_id,
        stall_id: conversation.stall_id,
        stallplass_id: conversation.stallplass_id!,
        start_dato: new Date(startDate).toISOString(),
        slutt_dato: endDate ? new Date(endDate).toISOString() : null,
        maanedlig_pris: monthlyPrice || conversation.stallplass!.maanedlig_pris,
        status: 'ACTIVE'
      })
      .select('*')
      .single();

    if (rentalCreateError) {
      console.error('Error creating rental:', rentalCreateError);
      throw rentalCreateError;
    }

    // Update box availability
    const { error: stallplassUpdateError } = await supabaseServer
      .from('stallplasser')
      .update({ er_tilgjengelig: false })
      .eq('id', conversation.stallplass_id!);

    if (stallplassUpdateError) {
      console.error('Error updating box availability:', stallplassUpdateError);
      // Try to rollback the rental creation
      await supabaseServer.from('utleie').delete().eq('id', rental.id);
      throw stallplassUpdateError;
    }

    // Update conversation status
    const { error: conversationUpdateError } = await supabaseServer
      .from('samtaler')
      .update({ 
        status: 'RENTAL_CONFIRMED',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (conversationUpdateError) {
      console.error('Error updating conversation status:', conversationUpdateError);
      // Don't rollback here as this is not critical
    }

    // Create system message
    const isOwnerConfirming = conversation.stable!.owner_id === userId;
    const messageContent = isOwnerConfirming 
      ? `Stallboksen "${conversation.box!.name}" er nå utleid til ${conversation.rider?.name || 'rytteren'}.`
      : `Du har bekreftet leie av stallboksen "${conversation.box!.name}".`;

    const { error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: messageContent,
        message_type: 'RENTAL_CONFIRMATION',
        metadata: {
          rentalId: rental.id,
          startDate: rental.start_date,
          endDate: rental.end_date,
          monthlyPrice: rental.monthly_price
        }
      });

    if (messageError) {
      console.error('Error creating system message:', messageError);
      // Don't rollback here as this is not critical
    }

    return NextResponse.json(rental);
  } catch (error) {
    console.error('Error confirming rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}