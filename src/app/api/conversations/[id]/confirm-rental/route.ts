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
      .from('conversations')
      .select(`
        *,
        box:boxes (*),
        stable:stables (owner_id),
        rider:users!conversations_rider_id_fkey (
          id,
          name
        )
      `)
      .eq('id', conversationId)
      .or(`rider_id.eq.${userId},stable.owner_id.eq.${userId}`)
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

    if (!conversation.box_id) {
      return NextResponse.json(
        { error: 'No box associated with this conversation' },
        { status: 400 }
      );
    }

    // Check if rental already exists
    const { data: existingRental, error: rentalError } = await supabaseServer
      .from('rentals')
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
      .from('rentals')
      .insert({
        conversation_id: conversationId,
        rider_id: conversation.rider_id,
        stable_id: conversation.stable_id,
        box_id: conversation.box_id!,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        monthly_price: monthlyPrice || conversation.box!.price,
        status: 'ACTIVE'
      })
      .select('*')
      .single();

    if (rentalCreateError) {
      console.error('Error creating rental:', rentalCreateError);
      throw rentalCreateError;
    }

    // Update box availability
    const { error: boxUpdateError } = await supabaseServer
      .from('boxes')
      .update({ is_available: false })
      .eq('id', conversation.box_id!);

    if (boxUpdateError) {
      console.error('Error updating box availability:', boxUpdateError);
      // Try to rollback the rental creation
      await supabaseServer.from('rentals').delete().eq('id', rental.id);
      throw boxUpdateError;
    }

    // Update conversation status
    const { error: conversationUpdateError } = await supabaseServer
      .from('conversations')
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