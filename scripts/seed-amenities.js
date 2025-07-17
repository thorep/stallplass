const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAmenities() {
  const amenities = [
    'Ridehall',
    'Daglig utgang',
    'Springbane',
    'Dressurarena',
    'Turstier',
    'Vaskeboks',
    'Veterinær',
    'Parkering',
    'Beite',
    'Paddock',
    'Solarium',
    'Hestesvømming'
  ];

  console.log('Seeding amenities...');

  for (const amenityName of amenities) {
    try {
      const amenity = await prisma.amenity.create({
        data: {
          name: amenityName
        }
      });
      console.log(`✅ Created amenity: ${amenity.name}`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Amenity '${amenityName}' already exists`);
      } else {
        console.error(`❌ Error creating '${amenityName}':`, error.message);
      }
    }
  }

  console.log('✅ Amenity seeding completed!');
}

seedAmenities()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });