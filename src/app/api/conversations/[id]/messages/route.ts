import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { withAuth } from '@/lib/supabase-auth-middleware';

export const GET = withAuth(async (
  request: NextRequest,
  { userId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;

    // Verify user has access to this conversation
    const { data: conversation, error: conversationError } = await supabaseServer
      .from('conversations')
      .select(`
        *,
        stall:staller (eier_id)
      `)
      .eq('id', conversationId)
      .or(`leietaker_id.eq.${userId},stall.eier_id.eq.${userId}`)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabaseServer
      .from('messages')
      .select(`
        *,
        avsender:brukere!meldinger_avsender_id_fkey (
          id,
          name,
          email,
          avatar
        )
      `)
      .eq('samtale_id', conversationId)
      .order('opprettet_dato', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    // Mark messages as read for current user
    const { error: markReadError } = await supabaseServer
      .from('messages')
      .update({ er_lest: true })
      .eq('samtale_id', conversationId)
      .neq('avsender_id', userId)
      .eq('er_lest', false);

    if (markReadError) {
      console.error('Error marking messages as read:', markReadError);
      // Don't throw here as this is not critical to the main operation
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (
  request: NextRequest,
  { userId },
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, messageType = 'TEXT', metadata } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const { data: conversation, error: conversationError } = await supabaseServer
      .from('conversations')
      .select(`
        *,
        stall:staller (eier_id)
      `)
      .eq('id', conversationId)
      .or(`leietaker_id.eq.${userId},stall.eier_id.eq.${userId}`)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Create message and update conversation timestamp
    // First create the message
    const { data: newMessage, error: messageError } = await supabaseServer
      .from('messages')
      .insert({
        samtale_id: conversationId,
        avsender_id: userId,
        content,
        melding_type: messageType,
        metadata
      })
      .select(`
        *,
        avsender:brukere!meldinger_avsender_id_fkey (
          id,
          name,
          email,
          avatar
        )
      `)
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      throw messageError;
    }

    // Update conversation timestamp
    const { error: updateError } = await supabaseServer
      .from('conversations')
      .update({ oppdatert_dato: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation timestamp:', updateError);
      // Don't throw here as the message was created successfully
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});