import { prisma } from '@/services/prisma';

// Simple boost daily price - can be configured via environment variable or hardcoded
const DEFAULT_BOOST_DAILY_PRICE = 50; // 50 NOK per day

export async function getBoostDailyPrice(): Promise<number> {
  // For now, return a fixed price. In the future, this could be stored in database
  return DEFAULT_BOOST_DAILY_PRICE;
}

// BasePrice interface for compatibility with PricingClient
interface BasePrice {
  price: number;
}

export async function getBoostDailyPriceObject(): Promise<BasePrice> {
  const price = await getBoostDailyPrice();
  return { price };
}

export async function calculateSponsoredPlacementCost(days: number): Promise<{ 
  dailyPrice: number; 
  baseTotal: number;
  discount: number;
  discountPercentage: number;
  totalCost: number;
}> {
  const dailyPrice = await getBoostDailyPrice();
  const baseTotal = dailyPrice * days;
  
  // Get applicable discount
  const boostDiscounts = await getAllBoostDiscounts();
  const applicableDiscount = boostDiscounts
    .filter((d) => {
      if (!d.isActive) return false;
      // Check if days falls within the range
      const meetsMin = days >= d.days;
      const meetsMax = d.maxDays === null || days <= d.maxDays;
      return meetsMin && meetsMax;
    })
    .sort((a, b) => b.percentage - a.percentage)[0];
  
  const discountPercentage = applicableDiscount?.percentage || 0;
  const discount = baseTotal * (discountPercentage / 100);
  const totalCost = baseTotal - discount;
  
  return {
    dailyPrice,
    baseTotal,
    discount,
    discountPercentage,
    totalCost
  };
}

// Boost pricing discount functions
export async function getAllBoostDiscounts() {
  try {
    const data = await prisma.boost_pricing_discounts.findMany({
      where: { isActive: true },
      orderBy: { days: 'asc' }
    });
    return data;
  } catch (error) {
    throw new Error(`Failed to get boost discounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBoostDiscountForDays(days: number): Promise<number> {
  try {
    const discounts = await prisma.boost_pricing_discounts.findMany({
      where: { 
        isActive: true,
        days: { lte: days }
      },
      orderBy: { days: 'desc' },
      take: 1
    });
    
    return discounts.length > 0 ? Number(discounts[0].percentage) : 0;
  } catch (error) {
    throw new Error(`Failed to get boost discount for days: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createBoostDiscount(data: { days: number; percentage: number; isActive?: boolean }) {
  try {
    return await prisma.boost_pricing_discounts.create({
      data: {
        days: data.days,
        percentage: data.percentage,
        isActive: data.isActive ?? true,
      }
    });
  } catch (error) {
    throw new Error(`Failed to create boost discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateBoostDiscount(id: string, data: { days?: number; percentage?: number; isActive?: boolean }) {
  try {
    return await prisma.boost_pricing_discounts.update({
      where: { id },
      data
    });
  } catch (error) {
    throw new Error(`Failed to update boost discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteBoostDiscount(id: string) {
  try {
    await prisma.boost_pricing_discounts.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete boost discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simple price range calculation without advertising filter
export async function getPriceRanges(): Promise<{
  boxes: { min: number; max: number };
  stables: { min: number; max: number };
}> {
  try {
    // Get box price range - all active boxes
    const boxPriceResult = await prisma.boxes.aggregate({
      where: {
        isAvailable: true,
        archived: false,
        price: { gt: 0 }
      },
      _min: { price: true },
      _max: { price: true }
    });

    // Get stable price range - calculate from all active boxes grouped by stable
    const stablesWithBoxes = await prisma.stables.findMany({
      where: {
        archived: false,
        boxes: {
          some: {
            isAvailable: true,
            archived: false,
            price: { gt: 0 }
          }
        }
      },
      include: {
        boxes: {
          where: {
            isAvailable: true,
            archived: false,
            price: { gt: 0 }
          },
          select: { price: true }
        }
      }
    });

    // Calculate min/max stable prices based on their box prices
    let stableMinPrice = 0;
    let stableMaxPrice = 0;
    
    if (stablesWithBoxes.length > 0) {
      const stablePrices = stablesWithBoxes.map(stable => {
        const boxPrices = stable.boxes.map(box => box.price);
        return {
          min: Math.min(...boxPrices),
          max: Math.max(...boxPrices)
        };
      });
      
      stableMinPrice = Math.min(...stablePrices.map(p => p.min));
      stableMaxPrice = Math.max(...stablePrices.map(p => p.max));
    }

    // Set defaults and round up max values
    const boxMin = boxPriceResult._min.price || 0;
    const boxMax = boxPriceResult._max.price || 10000;
    const stableMin = stableMinPrice || 0;
    const stableMax = stableMaxPrice || 15000;

    return {
      boxes: {
        min: boxMin,
        max: roundUpToNiceNumber(boxMax)
      },
      stables: {
        min: stableMin,
        max: roundUpToNiceNumber(stableMax)
      }
    };
  } catch {
    // Return reasonable defaults if there's an error
    return {
      boxes: { min: 0, max: 10000 },
      stables: { min: 0, max: 15000 }
    };
  }
}

// Helper function to round up to nice numbers
function roundUpToNiceNumber(value: number): number {
  if (value <= 0) return 0;
  
  // For values under 1000, round to nearest 100
  if (value < 1000) {
    return Math.ceil(value / 100) * 100;
  }
  
  // For values under 10000, round to nearest 500
  if (value < 10000) {
    return Math.ceil(value / 500) * 500;
  }
  
  // For larger values, round to nearest 1000
  return Math.ceil(value / 1000) * 1000;
}