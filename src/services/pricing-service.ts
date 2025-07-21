import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';

// Type aliases for convenience
type BasePrice = Tables<'base_prices'>;
type PricingDiscount = Tables<'pricing_discounts'>;

export async function getBasePrice(): Promise<number> {
  const { data: basePrice } = await supabase
    .from('base_prices')
    .select('price')
    .eq('is_active', true)
    .single();
  
  // Return the price in kroner, fallback to 10 kr if not found
  return basePrice?.maanedlig_pris || 10;
}

export async function getBasePriceObject(): Promise<BasePrice | null> {
  const { data, error } = await supabase
    .from('base_prices')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function getAllDiscounts(): Promise<PricingDiscount[]> {
  const { data, error } = await supabase
    .from('pricing_discounts')
    .select('*')
    .eq('is_active', true)
    .order('months', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to get discounts: ${error.message}`);
  }
  
  return data || [];
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
  
  return data;
}

export async function getDiscountForMonths(months: number): Promise<number> {
  const discount = await getDiscountByMonths(months);
  if (discount && discount.is_active) {
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

export async function updateBasePrice(id: string, maanedlig_pris: number): Promise<BasePrice> {
  const { data, error } = await supabase
    .from('base_prices')
    .update({ price })
    .eq('id', id)
    .select()
    .single();
  
  if (error || !data) {
    throw new Error(`Failed to update base maanedlig_pris: ${error?.message}`);
  }
  
  return data;
}

export async function createOrUpdateBasePrice(maanedlig_pris: number): Promise<BasePrice> {
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
      throw new Error(`Failed to update base maanedlig_pris: ${error?.message}`);
    }
    
    return data;
  } else {
    // Create new record if it doesn't exist
    const { data, error } = await supabase
      .from('base_prices')
      .insert([{
        name: 'monthly',
        price,
        description: 'Månedlig grunnpris per boks',
        is_active: true
      }])
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to create base maanedlig_pris: ${error?.message}`);
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
  return sponsoredPrice?.maanedlig_pris || 2;
}

export async function getSponsoredPlacementPriceObject(): Promise<BasePrice | null> {
  const { data, error } = await supabase
    .from('base_prices')
    .select('*')
    .eq('name', 'sponsored_placement')
    .eq('is_active', true)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

export async function updateSponsoredPlacementPrice(maanedlig_pris: number): Promise<BasePrice> {
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
      throw new Error(`Failed to update sponsored placement maanedlig_pris: ${error?.message}`);
    }
    
    return data;
  } else {
    // Create new record if it doesn't exist
    const { data, error } = await supabase
      .from('base_prices')
      .insert([{
        name: 'sponsored_placement',
        price,
        description: 'Daglig pris for betalt plassering per boks',
        is_active: true
      }])
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to create sponsored placement maanedlig_pris: ${error?.message}`);
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