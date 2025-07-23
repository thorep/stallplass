import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { withAuth } from '@/lib/supabase-auth-middleware';

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // First get stable IDs owned by this user
    const { data: ownedStables } = await supabaseServer
      .from('stables')
      .select('id')
      .eq('owner_id', userId);
    
    const ownedStableIds = ownedStables?.map(s => s.id) || [];

    // Get conversations where user is either rider or stable owner
    // Build the OR condition properly
    let query = supabaseServer
      .from('conversations')
      .select(`
        id,
        rider_id,
        stable_id,
        box_id,
        status,
        created_at,
        updated_at,
        rider:users!conversations_rider_id_fkey (
          id,
          name,
          email,
          avatar
        ),
        stable:stables (
          id,
          name,
          owner_id,
          owner:users!stables_owner_id_fkey (
            id,
            name,
            email
          )
        ),
        box:boxes (
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
      `);
    
    // Apply OR condition for rider or stable owner
    if (ownedStableIds.length > 0) {
      query = query.or(`rider_id.eq.${userId},stable_id.in.(${ownedStableIds.join(',')})`);
    } else {
      query = query.eq('rider_id', userId);
    }
    
    const { data: conversations, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    // Get latest message and unread count for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conversation) => {
        // Get latest message
        const { data: latestMessage } = await supabaseServer
          .from('messages')
          .select('id, content, message_type, created_at, is_read')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabaseServer
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

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
      .from('stables')
      .select('owner_id')
      .eq('id', stableId)
      .single();

    if (stableError && stableError.code !== 'PGRST116') {
      console.error('Error fetching stable:', stableError);
      throw stableError;
    }

    if (stable && stable.owner_id === userId) {
      return NextResponse.json(
        { error: 'Du kan ikke sende melding til din egen stall' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const { data: existingConversation, error: existingError } = await supabaseServer
      .from('conversations')
      .select('*')
      .eq('rider_id', userId)
      .eq('stable_id', stableId)
      .eq('box_id', boxId || null)
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
      .from('conversations')
      .insert({
        rider_id: userId,
        stable_id: stableId,
        box_id: boxId || null
      })
      .select('*')
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      throw conversationError;
    }

    // Then create the initial message
    const { error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        content: initialMessage,
        message_type: 'TEXT'
      })
      .select('*')
      .single();

    if (messageError) {
      console.error('Error creating initial message:', messageError);
      throw messageError;
    }

    // Fetch the complete conversation with all relations
    const { data: completeConversation, error: fetchError } = await supabaseServer
      .from('conversations')
      .select(`
        *,
        rider:users!conversations_rider_id_fkey (
          id,
          name,
          email,
          avatar
        ),
        stable:stables (
          id,
          name,
          owner:users!stables_owner_id_fkey (
            id,
            name,
            email
          )
        ),
        box:boxes (
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