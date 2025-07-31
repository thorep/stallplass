import { prisma } from './prisma';
import { service_pricing_discounts } from '@/generated/prisma';

export interface ServicePricingCalculation {
  basePricePerMonth: number;
  months: number;
  baseTotal: number;
  discount: {
    percentage: number;
    amount: number;
    months: number;
  } | null;
  finalTotal: number;
}

/**
 * Get all active service pricing discounts
 */
export async function getServicePricingDiscounts(): Promise<service_pricing_discounts[]> {
  try {
    const discounts = await prisma.service_pricing_discounts.findMany({
      where: { isActive: true },
      orderBy: { months: 'asc' },
    });
    return discounts;
  } catch (error) {
    throw new Error(`Failed to get service pricing discounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate service pricing with discounts
 */
export async function calculateServicePricing(
  months: number,
  basePricePerMonth?: number
): Promise<ServicePricingCalculation> {
  // Get base price from database if not provided
  if (!basePricePerMonth) {
    const { getServiceBasePrice } = await import('./pricing-service');
    basePricePerMonth = await getServiceBasePrice();
  }
  try {
    const discounts = await getServicePricingDiscounts();
    const baseTotal = basePricePerMonth * months;

    // Find the exact match for months (no threshold logic like days)
    const applicableDiscount = discounts
      .find(discount => discount.months === months);

    if (applicableDiscount && applicableDiscount.percentage > 0) {
      const discountAmount = baseTotal * (applicableDiscount.percentage / 100);
      return {
        basePricePerMonth,
        months,
        baseTotal,
        discount: {
          percentage: applicableDiscount.percentage,
          amount: discountAmount,
          months: applicableDiscount.months,
        },
        finalTotal: baseTotal - discountAmount,
      };
    }

    return {
      basePricePerMonth,
      months,
      baseTotal,
      discount: null,
      finalTotal: baseTotal,
    };
  } catch (error) {
    throw new Error(`Failed to calculate service pricing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available discount tiers for display
 */
export async function getServiceDiscountTiers(): Promise<Array<{
  months: number;
  percentage: number;
  label: string;
}>> {
  try {
    const discounts = await getServicePricingDiscounts();
    return discounts.map(discount => ({
      months: discount.months,
      percentage: discount.percentage,
      label: discount.months === 1 
        ? `${discount.months} måned${discount.percentage > 0 ? ` - ${discount.percentage}% rabatt` : ''}`
        : `${discount.months} måneder${discount.percentage > 0 ? ` - ${discount.percentage}% rabatt` : ''}`,
    }));
  } catch (error) {
    throw new Error(`Failed to get service discount tiers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}