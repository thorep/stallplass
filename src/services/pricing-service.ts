import { prisma } from '@/lib/prisma';
import { BasePrice, PricingDiscount } from '@prisma/client';

export async function getBasePrice(): Promise<BasePrice | null> {
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