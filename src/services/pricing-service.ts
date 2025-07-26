import { supabase } from '@/lib/supabase';
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
  const { data: basePrice } = await supabase
    .from('base_prices')
    .select('price')
    .eq('is_active', true)
    .single();
  
  // Return the price in kroner, fallback to 10 kr if not found
  return basePrice?.price || 10;
}

export async function getBasePriceObject(): Promise<BasePrice | null> {
  const { data, error } = await supabase
    .from('base_prices')
    .select('*')
    .eq('isActive', true)
    .single();
  
  if (error) {
    return null;
  }
  
  return data as BasePrice;
}

export async function getAllDiscounts(): Promise<PricingDiscount[]> {
  const { data, error } = await supabase
    .from('pricing_discounts')
    .select('*')
    .eq('isActive', true)
    .order('months', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to get discounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return (data || []) as PricingDiscount[];
}

export async function getDiscountByMonths(months: number): Promise<PricingDiscount | null> {
  const { data, error } = await supabase
    .from('pricing_discounts')
    .select('*')
    .eq('months', months)
    .single();
  
  if (error) {
    return null;
  }
  
  return data as PricingDiscount;
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
  const { data, error } = await supabase
    .from('base_prices')
    .update({ price })
    .eq('id', id)
    .select()
    .single();
  
  if (error || !data) {
    throw new Error(`Failed to update base price: ${error?.message}`);
  }
  
  return data;
}

export async function createOrUpdateBasePrice(price: number): Promise<BasePrice> {
  // First try to find existing record
  const { data: existing } = await supabase
    .from('base_prices')
    .select('*')
    .eq('name', 'monthly')
    .single();
  
  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('base_prices')
      .update({ price })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to update base price: ${error?.message}`);
    }
    
    return data;
  } else {
    // Create new record if it doesn't exist
    const { data, error } = await supabase
      .from('base_prices')
      .insert([{
        name: 'monthly',
        price,
        description: 'Monthly base price per box',
        is_active: true
      }])
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to create base price: ${error?.message}`);
    }
    
    return data;
  }
}

export async function createDiscount(data: {
  months: number;
  percentage: number;
}): Promise<PricingDiscount> {
  const { data: newDiscount, error } = await supabase
    .from('pricing_discounts')
    .insert([data])
    .select()
    .single();
  
  if (error || !newDiscount) {
    throw new Error(`Failed to create discount: ${error?.message}`);
  }
  
  return newDiscount;
}

export async function updateDiscount(id: string, updateData: Partial<{
  months: number;
  percentage: number;
  is_active: boolean;
}>): Promise<PricingDiscount> {
  const { data, error } = await supabase
    .from('pricing_discounts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error || !data) {
    throw new Error(`Failed to update discount: ${error?.message}`);
  }
  
  return data;
}

// Sponsored placement pricing functions
export async function getSponsoredPlacementPrice(): Promise<number> {
  const { data: sponsoredPrice } = await supabase
    .from('base_prices')
    .select('price')
    .eq('name', 'sponsored_placement')
    .eq('is_active', true)
    .single();
  
  // Return the price in kroner per day, fallback to 2 kr if not found
  return sponsoredPrice?.price || 2;
}

export async function getSponsoredPlacementPriceObject(): Promise<BasePrice | null> {
  const { data, error } = await supabase
    .from('base_prices')
    .select('*')
    .eq('name', 'sponsored_placement')
    .eq('isActive', true)
    .single();
  
  if (error) {
    return null;
  }
  
  return data as BasePrice;
}

export async function updateSponsoredPlacementPrice(price: number): Promise<BasePrice> {
  // First try to find existing record
  const { data: existing } = await supabase
    .from('base_prices')
    .select('*')
    .eq('name', 'sponsored_placement')
    .single();
  
  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('base_prices')
      .update({ price })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to update sponsored placement price: ${error?.message}`);
    }
    
    return data;
  } else {
    // Create new record if it doesn't exist
    const { data, error } = await supabase
      .from('base_prices')
      .insert([{
        name: 'sponsored_placement',
        price,
        description: 'Daily price for sponsored placement per box',
        is_active: true
      }])
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to create sponsored placement price: ${error?.message}`);
    }
    
    return data;
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