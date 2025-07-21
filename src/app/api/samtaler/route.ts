import { NextRequest, NextResponse } from 'next/server';
import { 
  hentBrukerSamtaler,
  sendMelding,
  markerMeldingerSomLest,
  type OpprettMeldingData
} from '@/services/chat-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const bruker_id = searchParams.get('bruker_id');
    
    if (!bruker_id) {
      return NextResponse.json(
        { error: 'bruker_id is required' },
        { status: 400 }
      );
    }
    
    const samtaler = await hentBrukerSamtaler(bruker_id);
    return NextResponse.json(samtaler);
    
  } catch (error) {
    console.error('Error fetching samtaler:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Sending melding with data:', data);
    
    // Check if this is a message sending request
    if (data.content && data.samtale_id && data.avsender_id) {
      // This is a message
      const meldingData: OpprettMeldingData = {
        samtale_id: data.samtale_id,
        avsender_id: data.avsender_id,
        content: data.content,
        melding_type: data.melding_type || 'TEXT'
      };
      
      const melding = await sendMelding(meldingData);
      return NextResponse.json(melding, { status: 201 });
    }
    
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
    if (data.samtale_id && data.bruker_id && data.action === 'marker_lest') {
      await markerMeldingerSomLest(data.samtale_id, data.bruker_id);
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