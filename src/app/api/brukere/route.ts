import { NextRequest, NextResponse } from 'next/server';
import { 
  opprettBruker,
  hentBrukerMedFirebaseId,
  oppdaterBruker,
  sikreAtBrukerEksisterer,
  slettBruker,
  type OpprettBrukerData,
  type OppdaterBrukerData
} from '@/services/user-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const firebase_id = searchParams.get('firebase_id');
    
    if (!firebase_id) {
      return NextResponse.json(
        { error: 'firebase_id is required' },
        { status: 400 }
      );
    }
    
    const bruker = await hentBrukerMedFirebaseId(firebase_id);
    
    if (!bruker) {
      return NextResponse.json(
        { error: 'Bruker not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(bruker);
    
  } catch (error) {
    console.error('Error fetching bruker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bruker' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating bruker with data:', data);
    
    // Check if this is an "ensure exists" request
    if (data.action === 'sikre_eksisterer' && data.firebase_id) {
      const bruker = await sikreAtBrukerEksisterer(data.firebase_id, data.defaultData);
      return NextResponse.json(bruker);
    }
    
    // Regular user creation
    if (!data.firebase_id || !data.email) {
      return NextResponse.json(
        { error: 'firebase_id and email are required' },
        { status: 400 }
      );
    }

    const brukerData: OpprettBrukerData = {
      firebase_id: data.firebase_id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      bio: data.bio,
      avatar: data.avatar,
      er_admin: data.er_admin || false
    };

    const bruker = await opprettBruker(brukerData);
    
    return NextResponse.json(bruker, { status: 201 });
  } catch (error) {
    console.error('Error creating bruker:', error);
    return NextResponse.json(
      { error: 'Failed to create bruker' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { firebase_id, ...updateData } = data;
    
    if (!firebase_id) {
      return NextResponse.json(
        { error: 'firebase_id is required' },
        { status: 400 }
      );
    }

    const brukerData: OppdaterBrukerData = {
      firebase_id,
      ...updateData
    };

    const bruker = await oppdaterBruker(brukerData);
    
    return NextResponse.json(bruker);
  } catch (error) {
    console.error('Error updating bruker:', error);
    return NextResponse.json(
      { error: 'Failed to update bruker' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const firebase_id = searchParams.get('firebase_id');
    
    if (!firebase_id) {
      return NextResponse.json(
        { error: 'firebase_id is required' },
        { status: 400 }
      );
    }

    await slettBruker(firebase_id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bruker:', error);
    return NextResponse.json(
      { error: 'Failed to delete bruker' },
      { status: 500 }
    );
  }
}