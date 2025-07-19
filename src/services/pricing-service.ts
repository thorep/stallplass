import { prisma } from '@/lib/prisma';
import { BasePrice, PricingDiscount } from '@prisma/client';

export async function getBasePrice(): Promise<number> {
  const basePrice = await prisma.basePrice.findFirst({
    where: { isActive: true }
  });
  
  // Return the price in kroner, fallback to 10 kr if not found
  return basePrice?.price || 10;
}

export async function getBasePriceObject(): Promise<BasePrice | null> {
  return await prisma.basePrice.findFirst({
    where: { isActive: true }
  });
}

export async function getAllDiscounts(): Promise<PricingDiscount[]> {
  return await prisma.pricingDiscount.findMany({
    where: { isActive: true },
    orderBy: { months: 'asc' }
  });
}

export async function getDiscountByMonths(months: number): Promise<PricingDiscount | null> {
  return await prisma.pricingDiscount.findUnique({
    where: { months }
  });
}

export async function getDiscountForMonths(months: number): Promise<number> {
  const discount = await getDiscountByMonths(months);
  if (discount && discount.isActive) {
    return discount.percentage;
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
  return await prisma.basePrice.update({
    where: { id },
    data: { price }
  });
}

export async function createDiscount(data: {
  months: number;
  percentage: number;
}): Promise<PricingDiscount> {
  return await prisma.pricingDiscount.create({
    data
  });
}

export async function updateDiscount(id: string, data: Partial<{
  months: number;
  percentage: number;
  isActive: boolean;
}>): Promise<PricingDiscount> {
  return await prisma.pricingDiscount.update({
    where: { id },
    data
  });
}

// Sponsored placement pricing functions
export async function getSponsoredPlacementPrice(): Promise<number> {
  const sponsoredPrice = await prisma.basePrice.findFirst({
    where: { 
      name: 'sponsored_placement',
      isActive: true 
    }
  });
  
  // Return the price in kroner per day, fallback to 2 kr if not found
  return sponsoredPrice?.price || 2;
}

export async function getSponsoredPlacementPriceObject(): Promise<BasePrice | null> {
  return await prisma.basePrice.findFirst({
    where: { 
      name: 'sponsored_placement',
      isActive: true 
    }
  });
}

export async function updateSponsoredPlacementPrice(price: number): Promise<BasePrice> {
  // First try to update existing record
  const existing = await prisma.basePrice.findFirst({
    where: { name: 'sponsored_placement' }
  });
  
  if (existing) {
    return await prisma.basePrice.update({
      where: { id: existing.id },
      data: { price }
    });
  } else {
    // Create new record if it doesn't exist
    return await prisma.basePrice.create({
      data: {
        name: 'sponsored_placement',
        price,
        description: 'Daglig pris for betalt plassering per boks',
        isActive: true
      }
    });
  }
}

export async function calculateSponsoredPlacementCost(days: number): Promise<{ dailyPrice: number; totalCost: number }> {
  const dailyPrice = await getSponsoredPlacementPrice();
  return {
    dailyPrice,
    totalCost: dailyPrice * days
  };
}