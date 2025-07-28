import { prisma } from '@/services/prisma';
import type { BasePrice, PricingDiscount } from '@/types';

// Type for box quantity discounts (table doesn't exist yet)
type BoxQuantityDiscount = {
  id: string;
  min_boxes: number;
  max_boxes: number | null;
  discount_percentage: number;
  is_active: boolean;
};

export async function getBasePrice(): Promise<number> {
  const basePrice = await prisma.base_prices.findFirst({
    where: { 
      name: 'Standard listing',
      isActive: true 
    },
    select: { price: true }
  });
  
  // Return the price in kroner, fallback to 19 kr if not found
  return basePrice?.price || 19;
}

export async function getBasePriceObject(): Promise<BasePrice | null> {
  try {
    const data = await prisma.base_prices.findFirst({
      where: { 
        name: 'Standard listing',
        isActive: true 
      }
    });
    return data as BasePrice | null;
  } catch {
    return null;
  }
}

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
  } catch {
    return null;
  }
}

export async function getDiscountForMonths(months: number): Promise<number> {
  const discount = await getDiscountByMonths(months);
  if (discount && discount.isActive) {
    return Number(discount.percentage);
  }
  
  // Fallback discounts if not in database
  const fallbackDiscounts: { [key: number]: number } = {
    1: 0,
    3: 0.05,
    6: 0.12,
    12: 0.15,
  };
  
  return fallbackDiscounts[months] || 0;
}

export async function updateBasePrice(id: string, price: number): Promise<BasePrice> {
  try {
    const data = await prisma.base_prices.update({
      where: { id },
      data: { price }
    });
    return data as BasePrice;
  } catch (error) {
    throw new Error(`Failed to update base price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createOrUpdateBasePrice(price: number): Promise<BasePrice> {
  try {
    // First try to find existing record
    const existing = await prisma.base_prices.findFirst({
      where: { name: 'Standard listing' }
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
          name: 'Standard listing',
          price,
          description: 'Monthly base price per box',
          isActive: true,
          updatedAt: new Date()
        }
      });
      return data as BasePrice;
    }
  } catch (error) {
    throw new Error(`Failed to create/update base price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

// Sponsored placement pricing functions
export async function getSponsoredPlacementPrice(): Promise<number> {
  const sponsoredPrice = await prisma.base_prices.findFirst({
    where: { 
      name: 'sponsored_placement',
      isActive: true 
    },
    select: { price: true }
  });
  
  // Return the price in kroner per day, fallback to 2 kr if not found
  return sponsoredPrice?.price || 2;
}

export async function getSponsoredPlacementPriceObject(): Promise<BasePrice | null> {
  try {
    const data = await prisma.base_prices.findFirst({
      where: { 
        name: 'sponsored_placement',
        isActive: true 
      }
    });
    return data as BasePrice | null;
  } catch {
    return null;
  }
}

export async function updateSponsoredPlacementPrice(price: number): Promise<BasePrice> {
  try {
    // First try to find existing record
    const existing = await prisma.base_prices.findFirst({
      where: { name: 'sponsored_placement' }
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
          name: 'sponsored_placement',
          price,
          description: 'Daily price for sponsored placement per box',
          isActive: true,
          updatedAt: new Date()
        }
      });
      return data as BasePrice;
    }
  } catch (error) {
    throw new Error(`Failed to update sponsored placement price: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function calculateSponsoredPlacementCost(days: number): Promise<{ dailyPrice: number; totalCost: number }> {
  const dailyPrice = await getSponsoredPlacementPrice();
  return {
    dailyPrice,
    totalCost: dailyPrice * days
  };
}

// Box quantity discount functions
export async function getAllBoxQuantityDiscounts(): Promise<BoxQuantityDiscount[]> {
  // Table doesn't exist yet, return fallback data
  return [
    {
      id: '1',
      min_boxes: 2,
      max_boxes: 5,
      discount_percentage: 10,
      is_active: true
    },
    {
      id: '2', 
      min_boxes: 6,
      max_boxes: null,
      discount_percentage: 15,
      is_active: true
    }
  ];
}

export async function getBoxQuantityDiscountForBoxCount(boxCount: number): Promise<BoxQuantityDiscount | null> {
  // Table doesn't exist yet, use fallback logic
  const allDiscounts = await getAllBoxQuantityDiscounts();
  
  // Find the applicable discount for the given box count
  const applicableDiscount = allDiscounts.find(discount => {
    return discount.is_active && 
           boxCount >= discount.min_boxes && 
           (discount.max_boxes === null || boxCount <= discount.max_boxes);
  });
  
  return applicableDiscount || null;
}

export async function getBoxQuantityDiscountPercentage(boxCount: number): Promise<number> {
  const discount = await getBoxQuantityDiscountForBoxCount(boxCount);
  if (discount && discount.is_active) {
    return Number(discount.discount_percentage);
  }
  
  // Fallback logic: 1 box = 0%, 2-5 boxes = 10%, 6+ boxes = 15%
  if (boxCount === 1) return 0;
  if (boxCount >= 2 && boxCount <= 5) return 10;
  if (boxCount >= 6) return 15;
  return 0;
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
  const baseMonthlyPrice = await getBasePrice();
  const totalMonthlyPrice = baseMonthlyPrice * boxCount;
  const totalPrice = totalMonthlyPrice * months;
  
  // Get month-based discount
  const monthDiscountPercentage = await getDiscountForMonths(months);
  const monthDiscount = totalPrice * monthDiscountPercentage;
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