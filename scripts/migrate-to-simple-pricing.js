const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating from PricingTier to simple pricing structure...');

  // Get the first tier pricing (our base price)
  const firstTier = await prisma.pricingTier.findFirst({
    where: { name: '1' }
  });

  if (firstTier) {
    // Create base price from first tier
    const existingBasePrice = await prisma.basePrice.findFirst();
    
    if (!existingBasePrice) {
      await prisma.basePrice.create({
        data: {
          name: 'monthly',
          price: firstTier.price, // Use the price from tier 1
          description: 'Monthly price per box',
          isActive: true
        }
      });
      console.log(`Created base price: ${firstTier.price} kr per box per month`);
    } else {
      console.log('Base price already exists');
    }
  }

  // Create discounts (these are hardcoded as per requirement)
  const existingDiscounts = await prisma.pricingDiscount.findMany();
  
  if (existingDiscounts.length === 0) {
    const discounts = [
      { months: 1, percentage: 0 },     // No discount for 1 month
      { months: 3, percentage: 0.05 },  // 5% discount for 3 months
      { months: 6, percentage: 0.12 },  // 12% discount for 6 months
      { months: 12, percentage: 0.15 }  // 15% discount for 12 months
    ];

    for (const discount of discounts) {
      await prisma.pricingDiscount.create({
        data: {
          months: discount.months,
          percentage: discount.percentage,
          isActive: true
        }
      });
      console.log(`Created discount: ${discount.months} months = ${discount.percentage * 100}%`);
    }
  } else {
    console.log('Discounts already exist');
  }

  console.log('✅ Migration to simple pricing structure completed!');
  console.log('You can now manually drop the old pricing_tiers table if desired.');
}

main()
  .catch((e) => {
    console.error('Error migrating pricing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });