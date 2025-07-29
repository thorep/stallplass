import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, unauthorizedResponse } from '@/lib/supabase-auth-middleware';
import { getAllDiscounts, getAllBoostDiscounts } from '@/services/pricing-service';
import { getServicePricingDiscounts } from '@/services/service-pricing-service';

export async function GET(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    // Get all discount types: box advertising, boost, and service pricing discounts
    const [boxDiscounts, boostDiscounts, serviceDiscounts] = await Promise.all([
      getAllDiscounts(),
      getAllBoostDiscounts(),
      getServicePricingDiscounts()
    ]);

    return NextResponse.json({
      boxDiscounts,
      boostDiscounts,
      serviceDiscounts
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { type, months, days, percentage, isActive } = body;
    
    if (type === 'service') {
      // Create service pricing discount
      const { prisma } = await import('@/services/prisma');
      const discount = await prisma.service_pricing_discounts.create({
        data: {
          days: days,
          percentage: percentage,
          isActive: isActive ?? true,
        }
      });
      return NextResponse.json(discount);
    } else if (type === 'boost') {
      // Create boost pricing discount
      const { createBoostDiscount } = await import('@/services/pricing-service');
      const discount = await createBoostDiscount({
        days: days,
        percentage: percentage,
        isActive: isActive ?? true,
      });
      return NextResponse.json(discount);
    } else {
      // Create box advertising discount
      const { createDiscount } = await import('@/services/pricing-service');
      const discount = await createDiscount({
        months: months,
        percentage: percentage
      });
      return NextResponse.json(discount);
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { id, type, months, days, percentage, isActive } = body;
    
    if (type === 'service') {
      // Update service pricing discount
      const { prisma } = await import('@/services/prisma');
      const discount = await prisma.service_pricing_discounts.update({
        where: { id },
        data: {
          days: days,
          percentage: percentage,
          isActive: isActive,
        }
      });
      return NextResponse.json(discount);
    } else if (type === 'boost') {
      // Update boost pricing discount
      const { updateBoostDiscount } = await import('@/services/pricing-service');
      const discount = await updateBoostDiscount(id, {
        days: days,
        percentage: percentage,
        isActive: isActive,
      });
      return NextResponse.json(discount);
    } else {
      // Update box advertising discount
      const { updateDiscount } = await import('@/services/pricing-service');
      const discount = await updateDiscount(id, {
        months: months,
        percentage: percentage,
        isActive: isActive
      });
      return NextResponse.json(discount);
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminId = await verifyAdminAccess(request);
  if (!adminId) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const { prisma } = await import('@/services/prisma');
    
    if (type === 'service') {
      // Delete service pricing discount
      await prisma.service_pricing_discounts.delete({
        where: { id }
      });
    } else if (type === 'boost') {
      // Delete boost pricing discount
      await prisma.boost_pricing_discounts.delete({
        where: { id }
      });
    } else {
      // Delete box advertising discount
      await prisma.pricing_discounts.delete({
        where: { id }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}