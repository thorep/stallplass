const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Updating pricing format from øre to kroner...');

  // Get all existing pricing tiers
  const existingTiers = await prisma.pricingTier.findMany();
  
  if (existingTiers.length === 0) {
    console.log('No pricing tiers found.');
    return;
  }

  // Update each tier that has prices in øre format (> 1000)
  for (const tier of existingTiers) {
    if (tier.price > 1000) {
      // Convert from øre to kroner (divide by 100)
      const newPrice = Math.round(tier.price / 100);
      
      await prisma.pricingTier.update({
        where: { id: tier.id },
        data: { price: newPrice }
      });
      
      console.log(`Updated tier "${tier.name}" from ${tier.price} øre to ${newPrice} kr`);
    } else {
      console.log(`Tier "${tier.name}" already uses kroner format (${tier.price} kr)`);
    }
  }

  console.log('✅ Pricing format updated successfully!');
}

main()
  .catch((e) => {
    console.error('Error updating pricing format:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });