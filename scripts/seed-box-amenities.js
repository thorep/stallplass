const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const boxAmenities = [
  'Vannkran',
  'Strøm',
  'Daglig utgang',
  'Vaskeboks',
  'Oppvarming',
  'Automatisk vannsystem',
  'Gummimatte',
  'Høyring',
  'Kraftfôr inkludert',
  'Daglig tilsyn'
];

async function seedBoxAmenities() {
  console.log('Seeding box amenities...');
  
  try {
    // Clear existing box amenities (if they exist)
    try {
      await prisma.boxAmenityLink.deleteMany({});
    } catch (e) {
      // Table might not exist yet
    }
    
    try {
      await prisma.boxAmenity.deleteMany({});
    } catch (e) {
      // Table might not exist yet
    }
    
    // Insert new box amenities
    for (const amenityName of boxAmenities) {
      await prisma.boxAmenity.create({
        data: { name: amenityName }
      });
    }
    
    console.log(`✅ Seeded ${boxAmenities.length} box amenities`);
  } catch (error) {
    console.error('Error seeding box amenities:', error);
    throw error;
  }
}

if (require.main === module) {
  seedBoxAmenities()
    .then(() => {
      console.log('✅ Box amenities seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding box amenities:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { seedBoxAmenities };