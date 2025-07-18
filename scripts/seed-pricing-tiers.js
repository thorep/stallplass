const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding pricing tiers...');

  // Check if pricing tiers already exist
  const existingTiers = await prisma.pricingTier.findMany();
  
  if (existingTiers.length > 0) {
    console.log('Pricing tiers already exist. Skipping seed.');
    return;
  }

  // Create the default pricing tiers
  const defaultTiers = [
    {
      name: '1',
      price: 99, // 99 kr (whole number, no øre precision needed)
      displayName: 'Standard',
      description: 'Per boks per måned',
      features: [
        'Full synlighet for din stall',
        'Kun bokser du velger vises i søk',
        'Kontaktinformasjon til interesserte',
        'Ubegrenset visninger av annonser',
        'Dashboard for administrasjon',
        'Mobiloptimalisert',
        'E-post og telefonstøtte'
      ],
      isActive: true
    },
    // You can add more tiers here in the future
  ];

  for (const tier of defaultTiers) {
    await prisma.pricingTier.create({
      data: tier
    });
    console.log(`Created pricing tier: ${tier.displayName}`);
  }

  console.log('✅ Pricing tiers seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding pricing tiers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });