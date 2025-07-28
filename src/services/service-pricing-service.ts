import { prisma } from './prisma';
import { service_pricing_discounts } from '@/generated/prisma';

export interface ServicePricingCalculation {
  basePricePerDay: number;
  days: number;
  baseTotal: number;
  discount: {
    percentage: number;
    amount: number;
    days: number;
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
      orderBy: { days: 'asc' },
    });
    return discounts;
  } catch (_) {
    // Return fallback discounts
    return [
      { id: '1', days: 30, percentage: 10.0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', days: 60, percentage: 15.0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', days: 90, percentage: 20.0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];
  }
}

/**
 * Calculate service pricing with discounts
 */
export async function calculateServicePricing(
  days: number,
  basePricePerDay: number = 2
): Promise<ServicePricingCalculation> {
  try {
    const discounts = await getServicePricingDiscounts();
    const baseTotal = basePricePerDay * days;

    // Find the highest applicable discount
    const applicableDiscount = discounts
      .filter(discount => days >= discount.days)
      .sort((a, b) => b.percentage - a.percentage)[0];

    if (applicableDiscount) {
      const discountAmount = baseTotal * (applicableDiscount.percentage / 100);
      return {
        basePricePerDay,
        days,
        baseTotal,
        discount: {
          percentage: applicableDiscount.percentage,
          amount: discountAmount,
          days: applicableDiscount.days,
        },
        finalTotal: baseTotal - discountAmount,
      };
    }

    return {
      basePricePerDay,
      days,
      baseTotal,
      discount: null,
      finalTotal: baseTotal,
    };
  } catch (_) {
    // Return basic calculation without discounts
    const baseTotal = basePricePerDay * days;
    return {
      basePricePerDay,
      days,
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
  days: number;
  percentage: number;
  label: string;
}>> {
  try {
    const discounts = await getServicePricingDiscounts();
    return discounts.map(discount => ({
      days: discount.days,
      percentage: discount.percentage,
      label: `${discount.days} dager - ${discount.percentage}% rabatt`,
    }));
  } catch (_) {
    // Return fallback tiers
    return [
      { days: 30, percentage: 10, label: '30 dager - 10% rabatt' },
      { days: 60, percentage: 15, label: '60 dager - 15% rabatt' },
      { days: 90, percentage: 20, label: '90 dager - 20% rabatt' },
    ];
  }
}