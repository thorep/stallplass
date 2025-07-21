import { NextRequest, NextResponse } from 'next/server';
import { 
  hentBrukerSamtaler,
  markerMeldingerSomLest
} from '@/services/chat-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const user_id = searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    const conversations = await hentBrukerSamtaler(user_id);
    return NextResponse.json(conversations);
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Sending melding with data:', data);
    
    // TODO: Fix type interface mismatch for OpprettMeldingData
    // Check if this is a message sending request
    // if (data.content && data.conversation_id && data.sender_id) {
    //   // This is a message
    //   const meldingData: OpprettMeldingData = {
    //     samtaleId: data.conversation_id,
    //     avsenderId: data.sender_id,
    //     content: data.content,
    //     meldingType: data.message_type || 'TEXT'
    //   };
    //   
    //   const melding = await sendMelding(meldingData);
    //   return NextResponse.json(melding, { status: 201 });
    // }
    
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error sending melding:', error);
    return NextResponse.json(
      { error: 'Failed to send melding' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Handle marking messages as read
    if (data.conversation_id && data.user_id && data.action === 'markis_read') {
      await markerMeldingerSomLest(data.conversation_id, data.user_id);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error updating samtale:', error);
    return NextResponse.json(
      { error: 'Failed to update samtale' },
      { status: 500 }
    );
  }
}