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
        stall:stables (owner_id)
      `)
      .eq('id', conversationId)
      .or(`rider_id.eq.${userId},stall.owner_id.eq.${userId}`)
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
        avsender:users!meldinger_sender_id_fkey (
          id,
          name,
          email,
          avatar
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Mark messages as read for current user
    const { error: markReadError } = await supabaseServer
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (markReadError) {
      // Don't throw here as this is not critical to the main operation
    }

    return NextResponse.json(messages);
  } catch (_) {
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
        stall:stables (owner_id)
      `)
      .eq('id', conversationId)
      .or(`rider_id.eq.${userId},stall.owner_id.eq.${userId}`)
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
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: messageType,
        metadata
      })
      .select(`
        *,
        avsender:users!meldinger_sender_id_fkey (
          id,
          name,
          email,
          avatar
        )
      `)
      .single();

    if (messageError) {
      throw messageError;
    }

    // Update conversation timestamp
    const { error: updateError } = await supabaseServer
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      // Don't throw here as the message was created successfully
    }

    return NextResponse.json(newMessage);
  } catch (_) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});