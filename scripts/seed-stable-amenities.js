const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const stableAmenities = [
  'Ridehall',
  'Springbane', 
  'Dressurarena',
  'Turstier',
  'Veterinær',
  'Parkering',
  'Beite',
  'Paddock',
  'Solarium',
  'Hestesvømming'
];

async function seedStableAmenities() {
  console.log('Seeding stable amenities...');
  
  try {
    // Clear existing stable amenities (if they exist)
    try {
      await prisma.stableAmenityLink.deleteMany({});
    } catch (e) {
      // Table might not exist yet
    }
    
    try {
      await prisma.stableAmenity.deleteMany({});
    } catch (e) {
      // Table might not exist yet
    }
    
    // Insert new stable amenities
    for (const amenityName of stableAmenities) {
      await prisma.stableAmenity.create({
        data: { name: amenityName }
      });
    }
    
    console.log(`✅ Seeded ${stableAmenities.length} stable amenities`);
  } catch (error) {
    console.error('Error seeding stable amenities:', error);
    throw error;
  }
}

if (require.main === module) {
  seedStableAmenities()
    .then(() => {
      console.log('✅ Stable amenities seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding stable amenities:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { seedStableAmenities };