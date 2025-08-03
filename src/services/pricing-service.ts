import { prisma } from '@/services/prisma';
import type { BasePrice, PricingDiscount } from '@/types';


export async function getAllDiscounts(): Promise<PricingDiscount[]> {
  try {
    const data = await prisma.pricing_discounts.findMany({
      where: { isActive: true },
      orderBy: { months: 'asc' }
    });
    return data as PricingDiscount[];
  } catch (error) {
    throw new Error(`Failed to get discounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getDiscountByMonths(months: number): Promise<PricingDiscount | null> {
  try {
    const data = await prisma.pricing_discounts.findFirst({
      where: { months }
    });
    return data as PricingDiscount | null;
  } catch (error) {
    throw new Error(`Failed to get discount by months: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getDiscountForMonths(months: number): Promise<number> {
  const discount = await getDiscountByMonths(months);
  if (discount && discount.isActive) {
    return Number(discount.percentage);
  }
  
  return 0;
}



export async function createDiscount(data: {
  months: number;
  percentage: number;
}): Promise<PricingDiscount> {
  try {
    const newDiscount = await prisma.pricing_discounts.create({
      data: {
        months: data.months,
        percentage: data.percentage,
        isActive: true,
        updatedAt: new Date()
      }
    });
    return newDiscount as PricingDiscount;
  } catch (error) {
    throw new Error(`Failed to create discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateDiscount(id: string, updateData: Partial<{
  months: number;
  percentage: number;
  isActive: boolean;
}>): Promise<PricingDiscount> {
  try {
    const data = await prisma.pricing_discounts.update({
      where: { id },
      data: updateData
    });
    return data as PricingDiscount;
  } catch (error) {
    throw new Error(`Failed to update discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Service base pricing functions
export async function getServiceBasePrice(): Promise<number> {
  try {
    const servicePrice = await prisma.base_prices.findFirst({
      where: { 
        name: 'Service base',
        isActive: true 
      },
      select: { price: true }
    });
    
    if (!servicePrice) {
      throw new Error('Service base price not found in database');
    }
    
    return servicePrice.price;
  } catch (error) {
    throw new Error(`Failed to get service base price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getServiceBasePriceObject(): Promise<BasePrice | null> {
  try {
    const data = await prisma.base_prices.findFirst({
      where: { 
        name: 'Service base',
        isActive: true 
      }
    });
    return data as BasePrice | null;
  } catch {
    return null;
  }
}

export async function createOrUpdateServiceBasePrice(price: number): Promise<BasePrice> {
  try {
    // First try to find existing record
    const existing = await prisma.base_prices.findFirst({
      where: { name: 'Service base' }
    });
    
    if (existing) {
      // Update existing record
      const data = await prisma.base_prices.update({
        where: { id: existing.id },
        data: { price }
      });
      return data as BasePrice;
    } else {
      // Create new record if it doesn't exist
      const data = await prisma.base_prices.create({
        data: {
          name: 'Service base',
          price,
          description: 'Monthly base price for service listings',
          isActive: true,
          updatedAt: new Date()
        }
      });
      return data as BasePrice;
    }
  } catch (error) {
    throw new Error(`Failed to create/update service base price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Sponsored placement pricing functions
export async function getSponsoredPlacementPrice(): Promise<number> {
  try {
    const sponsoredPrice = await prisma.base_prices.findFirst({
      where: { 
        name: 'Box boost',
        isActive: true 
      },
      select: { price: true }
    });
    
    if (!sponsoredPrice) {
      throw new Error('Box boost price not found in database');
    }
    
    return sponsoredPrice.price;
  } catch (error) {
    throw new Error(`Failed to get box boost price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSponsoredPlacementPriceObject(): Promise<BasePrice | null> {
  try {
    const data = await prisma.base_prices.findFirst({
      where: { 
        name: 'Box boost',
        isActive: true 
      }
    });
    return data as BasePrice | null;
  } catch {
    return null;
  }
}

export async function createOrUpdateSponsoredPlacementPrice(price: number): Promise<BasePrice> {
  try {
    // First try to find existing record
    const existing = await prisma.base_prices.findFirst({
      where: { name: 'Box boost' }
    });
    
    if (existing) {
      // Update existing record
      const data = await prisma.base_prices.update({
        where: { id: existing.id },
        data: { price }
      });
      return data as BasePrice;
    } else {
      // Create new record if it doesn't exist
      const data = await prisma.base_prices.create({
        data: {
          name: 'Box boost',
          price,
          description: 'Daily price for box boost placement per box',
          isActive: true,
          updatedAt: new Date()
        }
      });
      return data as BasePrice;
    }
  } catch (error) {
    throw new Error(`Failed to update box boost price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function calculateSponsoredPlacementCost(days: number): Promise<{ 
  dailyPrice: number; 
  baseTotal: number;
  discount: number;
  discountPercentage: number;
  totalCost: number;
}> {
  const dailyPrice = await getSponsoredPlacementPrice();
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

// Box quantity discount functions
export async function getAllBoxQuantityDiscounts() {
  try {
    const data = await prisma.box_quantity_discounts.findMany({
      where: { isActive: true },
      orderBy: { minBoxes: 'asc' }
    });
    return data;
  } catch (error) {
    throw new Error(`Failed to get box quantity discounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBoxQuantityDiscountForBoxCount(boxCount: number) {
  try {
    const data = await prisma.box_quantity_discounts.findFirst({
      where: {
        isActive: true,
        minBoxes: { lte: boxCount },
        OR: [
          { maxBoxes: null },
          { maxBoxes: { gte: boxCount } }
        ]
      },
      orderBy: { minBoxes: 'desc' }
    });
    return data;
  } catch (error) {
    throw new Error(`Failed to get box quantity discount: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBoxQuantityDiscountPercentage(boxCount: number): Promise<number> {
  const discount = await getBoxQuantityDiscountForBoxCount(boxCount);
  if (discount && discount.isActive) {
    return Number(discount.discountPercentage);
  }
  
  return 0;
}

export async function getBoxAdvertisingPrice(): Promise<number> {
  try {
    const boxPrice = await prisma.base_prices.findFirst({
      where: { 
        name: 'Box advertising',
        isActive: true 
      },
      select: { price: true }
    });
    
    if (!boxPrice) {
      throw new Error('Box advertising price not found in database');
    }
    
    return boxPrice.price;
  } catch (error) {
    throw new Error(`Failed to get box advertising price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBoxAdvertisingPriceObject(): Promise<BasePrice | null> {
  try {
    const data = await prisma.base_prices.findFirst({
      where: { 
        name: 'Box advertising',
        isActive: true 
      }
    });
    return data as BasePrice | null;
  } catch {
    return null;
  }
}

export async function createOrUpdateBoxAdvertisingPrice(price: number): Promise<BasePrice> {
  try {
    // First try to find existing record
    const existing = await prisma.base_prices.findFirst({
      where: { name: 'Box advertising' }
    });
    
    if (existing) {
      // Update existing record
      const data = await prisma.base_prices.update({
        where: { id: existing.id },
        data: { price }
      });
      return data as BasePrice;
    } else {
      // Create new record if it doesn't exist
      const data = await prisma.base_prices.create({
        data: {
          name: 'Box advertising',
          price,
          description: 'Monthly base price for box advertising',
          isActive: true,
          updatedAt: new Date()
        }
      });
      return data as BasePrice;
    }
  } catch (error) {
    throw new Error(`Failed to create/update box advertising price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function calculatePricingWithDiscounts(
  boxCount: number, 
  months: number
): Promise<{
  baseMonthlyPrice: number;
  totalMonthlyPrice: number;
  monthDiscount: number;
  monthDiscountPercentage: number;
  boxQuantityDiscount: number;
  boxQuantityDiscountPercentage: number;
  totalPrice: number;
  finalPrice: number;
}> {
  const baseMonthlyPrice = await getBoxAdvertisingPrice();
  const totalMonthlyPrice = baseMonthlyPrice * boxCount;
  const totalPrice = totalMonthlyPrice * months;
  
  // Get month-based discount
  const monthDiscountPercentage = await getDiscountForMonths(months);
  const monthDiscount = totalPrice * (monthDiscountPercentage / 100);
  const priceAfterMonthDiscount = totalPrice - monthDiscount;
  
  // Get box quantity discount (applies to the month-discounted price)
  const boxQuantityDiscountPercentage = await getBoxQuantityDiscountPercentage(boxCount);
  const boxQuantityDiscount = priceAfterMonthDiscount * (boxQuantityDiscountPercentage / 100);
  
  const finalPrice = priceAfterMonthDiscount - boxQuantityDiscount;
  
  return {
    baseMonthlyPrice,
    totalMonthlyPrice,
    monthDiscount,
    monthDiscountPercentage,
    boxQuantityDiscount,
    boxQuantityDiscountPercentage,
    totalPrice,
    finalPrice
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

/**
 * Get price ranges for both boxes and stables
 */
export async function getPriceRanges(): Promise<{
  boxes: { min: number; max: number };
  stables: { min: number; max: number };
}> {
  try {
    const now = new Date();
    
    // Get box price range - only include boxes with active advertising
    const boxPriceResult = await prisma.boxes.aggregate({
      where: {
        advertisingActive: true,
        advertisingEndDate: { gt: now },
        price: { gt: 0 }
      },
      _min: { price: true },
      _max: { price: true },
      _count: true
    });

    // Get stable price range - calculate from boxes grouped by stable
    // Only include stables that have boxes with active advertising
    const stablesWithBoxes = await prisma.stables.findMany({
      where: {
        boxes: {
          some: {
            advertisingActive: true,
            advertisingEndDate: { gt: now },
            price: { gt: 0 }
          }
        }
      },
      include: {
        boxes: {
          where: {
            advertisingActive: true,
            advertisingEndDate: { gt: now },
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
    const boxMax = boxPriceResult._max.price || 10000; // Default fallback
    const stableMin = stableMinPrice || 0;
    const stableMax = stableMaxPrice || 15000; // Default fallback

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