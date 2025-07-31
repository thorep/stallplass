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
  } catch {
    // Return fallback discounts (1, 3, 6, 12 months with progressive discounts)
    return [
      { id: '1', months: 1, percentage: 0.0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', months: 3, percentage: 5.0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', months: 6, percentage: 10.0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '4', months: 12, percentage: 15.0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];
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
  } catch {
    // Return basic calculation without discounts
    const baseTotal = basePricePerMonth * months;
    return {
      basePricePerMonth,
      months,
      baseTotal,
      discount: null,
      finalTotal: baseTotal,
    };
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
  } catch {
    // Return fallback tiers
    return [
      { months: 1, percentage: 0, label: '1 måned' },
      { months: 3, percentage: 5, label: '3 måneder - 5% rabatt' },
      { months: 6, percentage: 10, label: '6 måneder - 10% rabatt' },
      { months: 12, percentage: 15, label: '12 måneder - 15% rabatt' },
    ];
  }
}