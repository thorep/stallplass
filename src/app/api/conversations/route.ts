import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { withAuth } from '@/lib/supabase-auth-middleware';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {

    // Get conversations where user is either rider or stable owner
    // userId is now verified from the Firebase token
    const { data: conversations, error } = await supabaseServer
      .from('samtaler')
      .select(`
        id,
        leietaker_id,
        stall_id,
        stallplass_id,
        status,
        opprettet_dato,
        oppdatert_dato,
        rider:brukere!samtaler_leietaker_id_fkey (
          id,
          name,
          email,
          avatar
        ),
        stable:staller (
          id,
          name,
          owner_name,
          owner_email,
          owner_id
        ),
        box:stallplasser (
          id,
          name,
          price,
          is_available
        ),
        rental:rentals (
          id,
          status,
          start_date,
          end_date
        )
      `)
      .or(`leietaker_id.eq.${userId},stable.owner_id.eq.${userId}`)
      .order('oppdatert_dato', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    // Get latest message and unread count for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conversation) => {
        // Get latest message
        const { data: latestMessage } = await supabaseServer
          .from('meldinger')
          .select('id, content, melding_type, opprettet_dato, er_lest')
          .eq('samtale_id', conversation.id)
          .order('opprettet_dato', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabaseServer
          .from('meldinger')
          .select('*', { count: 'exact', head: true })
          .eq('samtale_id', conversation.id)
          .eq('er_lest', false)
          .neq('avsender_id', userId);

        return {
          ...conversation,
          messages: latestMessage ? [latestMessage] : [],
          _count: {
            messages: unreadCount || 0
          }
        };
      })
    );

    return NextResponse.json(conversationsWithMessages);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json();
    const { stableId, boxId, initialMessage } = body;

    if (!stableId || !initialMessage) {
      return NextResponse.json(
        { error: 'Stable ID and initial message are required' },
        { status: 400 }
      );
    }

    // Check if user is trying to message their own stable
    const { data: stable, error: stableError } = await supabaseServer
      .from('staller')
      .select('eier_id')
      .eq('id', stableId)
      .single();

    if (stableError && stableError.code !== 'PGRST116') {
      console.error('Error fetching stable:', stableError);
      throw stableError;
    }

    if (stable && stable.eier_id === userId) {
      return NextResponse.json(
        { error: 'Du kan ikke sende melding til din egen stall' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const { data: existingConversation, error: existingError } = await supabaseServer
      .from('samtaler')
      .select('*')
      .eq('leietaker_id', userId)
      .eq('stall_id', stableId)
      .eq('stallplass_id', boxId || null)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing conversation:', existingError);
      throw existingError;
    }

    if (existingConversation) {
      return NextResponse.json(existingConversation);
    }

    // Create new conversation with initial message
    // First create the conversation
    const { data: conversation, error: conversationError } = await supabaseServer
      .from('samtaler')
      .insert({
        leietaker_id: userId,
        stall_id: stableId,
        stallplass_id: boxId || null
      })
      .select('*')
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      throw conversationError;
    }

    // Then create the initial message
    const { error: messageError } = await supabaseServer
      .from('meldinger')
      .insert({
        samtale_id: conversation.id,
        avsender_id: userId,
        content: initialMessage,
        melding_type: 'TEXT'
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Error creating initial message:', messageError);
      throw messageError;
    }

    // Fetch the complete conversation with all relations
    const { data: completeConversation, error: fetchError } = await supabaseServer
      .from('samtaler')
      .select(`
        *,
        rider:brukere!samtaler_leietaker_id_fkey (
          id,
          name,
          email,
          avatar
        ),
        stable:staller (
          id,
          name,
          owner_name
        ),
        box:stallplasser (
          id,
          name,
          price
        ),
        messages (*)
      `)
      .eq('id', conversation.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete conversation:', fetchError);
      throw fetchError;
    }

    return NextResponse.json(completeConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});