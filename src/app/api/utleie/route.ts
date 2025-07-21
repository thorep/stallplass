import { NextRequest, NextResponse } from 'next/server';
import { 
  hentStalleierUtleier,
  opprettUtleie,
  oppdaterUtleieStatus,
  hentStalleierUtleieStatistikk,
  type OpprettUtleieData
} from '@/services/rental-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const bruker_id = searchParams.get('bruker_id');
    const type = searchParams.get('type'); // 'eier' or 'leietaker' 
    const statistikk = searchParams.get('statistikk') === 'true';
    const stall_id = searchParams.get('stall_id');
    
    if (!bruker_id) {
      return NextResponse.json(
        { error: 'bruker_id is required' },
        { status: 400 }
      );
    }
    
    if (statistikk) {
      const stats = await hentStalleierUtleieStatistikk(bruker_id);
      return NextResponse.json(stats);
    }
    
    // Get rentals based on type
    if (type === 'eier' || !type) {
      const utleier = await hentStalleierUtleier(bruker_id);
      return NextResponse.json(utleier);
    }
    
    // For leietaker type, we would need a separate function
    return NextResponse.json([]);
    
  } catch (error) {
    console.error('Error fetching utleie:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('Creating utleie with data:', data);
    
    // Validate required fields  
    if (!data.stallplass_id || !data.stall_id || !data.leietaker_id || !data.samtale_id) {
      return NextResponse.json(
        { error: 'stallplass_id, stall_id, leietaker_id, and samtale_id are required' },
        { status: 400 }
      );
    }

    const utleie = await opprettUtleie(data as OpprettUtleieData);
    
    return NextResponse.json(utleie, { status: 201 });
  } catch (error) {
    console.error('Error creating utleie:', error);
    return NextResponse.json(
      { error: 'Failed to create utleie' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    const { id, status, ...otherData } = data;
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const utleie = await oppdaterUtleieStatus(id, status);
    
    return NextResponse.json(utleie);
  } catch (error) {
    console.error('Error updating utleie:', error);
    return NextResponse.json(
      { error: 'Failed to update utleie' },
      { status: 500 }
    );
  }
}