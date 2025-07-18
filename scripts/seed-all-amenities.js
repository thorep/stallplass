const { seedStableAmenities } = require('./seed-stable-amenities');
const { seedBoxAmenities } = require('./seed-box-amenities');

async function seedAllAmenities() {
  console.log('Starting amenity seeding...');
  
  try {
    await seedStableAmenities();
    await seedBoxAmenities();
    
    console.log('✅ All amenities seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding amenities:', error);
    throw error;
  }
}

if (require.main === module) {
  seedAllAmenities()
    .then(() => {
      console.log('✅ Amenity seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding amenities:', error);
      process.exit(1);
    });
}

module.exports = { seedAllAmenities };