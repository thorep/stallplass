import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { logger } from '@/lib/logger';

interface PriceRanges {
  boxes: {
    min: number;
    max: number;
  };
  stables: {
    min: number;
    max: number;
  };
}

// Round up to next nice number (e.g., 6234 -> 7000, 15678 -> 16000)
function roundUpToNiceNumber(value: number): number {
  if (value <= 1000) {
    return Math.ceil(value / 100) * 100; // Round to nearest 100
  } else if (value <= 10000) {
    return Math.ceil(value / 500) * 500; // Round to nearest 500
  } else {
    return Math.ceil(value / 1000) * 1000; // Round to nearest 1000
  }
}

export async function GET() {
  try {
    logger.info('Fetching price ranges...');
    
    // Get box price range (only for publicly available boxes)
    const boxPrices = await prisma.boxes.aggregate({
      _min: { price: true },
      _max: { price: true },
      where: {
        stables: {
          // No advertising filter for now, since stables don't seem to have advertising fields
        }
      }
    });

    logger.info('Box prices:', boxPrices);

    // For stables, we'll use the box price ranges since users filter stables by their box prices
    // When searching stables, they're looking at the price range of boxes within those stables
    const stableMin = boxPrices._min.price || 0;
    const stableMax = boxPrices._max.price || 0;

    logger.info('Stable price range calculated:', { stableMin, stableMax });

    // Fallback defaults if no data found
    const defaultBoxRange = { min: 0, max: 10000 };
    const defaultStableRange = { min: 0, max: 15000 };

    const priceRanges: PriceRanges = {
      boxes: {
        min: boxPrices._min.price || defaultBoxRange.min,
        max: boxPrices._max.price 
          ? roundUpToNiceNumber(boxPrices._max.price)
          : defaultBoxRange.max
      },
      stables: {
        min: Math.floor(stableMin) || defaultStableRange.min,
        max: stableMax 
          ? roundUpToNiceNumber(stableMax)
          : defaultStableRange.max
      }
    };

    logger.info('Final price ranges:', priceRanges);
    return NextResponse.json(priceRanges);
  } catch (error) {
    logger.error('Error fetching price ranges:', error);
    
    // Return fallback ranges on error
    return NextResponse.json({
      boxes: { min: 0, max: 10000 },
      stables: { min: 0, max: 15000 }
    });
  }
}