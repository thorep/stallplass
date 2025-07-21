import { NextRequest, NextResponse } from 'next/server';
import { 
  getStableOwnerRentals,
  createRental,
  updateRentalStatus,
  getStableOwnerRentalStats,
  type CreateRentalData
} from '@/services/rental-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const user_id = searchParams.get('user_id');
    const type = searchParams.get('type'); // 'eier' or 'leietaker' 
    const statistikk = searchParams.get('statistikk') === 'true';
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    if (statistikk) {
      const stats = await getStableOwnerRentalStats(user_id);
      return NextResponse.json(stats);
    }
    
    // Get rentals based on type
    if (type === 'eier' || !type) {
      const rentals = await getStableOwnerRentals(user_id);
      return NextResponse.json(rentals);
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
    if (!data.box_id || !data.stable_id || !data.rider_id || !data.conversation_id) {
      return NextResponse.json(
        { error: 'box_id, stable_id, rider_id, and conversation_id are required' },
        { status: 400 }
      );
    }

    const rental = await createRental(data as CreateRentalData);
    
    return NextResponse.json(rental, { status: 201 });
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
    
    const { id, status } = data;
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const rental = await updateRentalStatus(id, status);
    
    return NextResponse.json(rental);
  } catch (error) {
    console.error('Error updating utleie:', error);
    return NextResponse.json(
      { error: 'Failed to update utleie' },
      { status: 500 }
    );
  }
}