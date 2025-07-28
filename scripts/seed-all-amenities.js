const { seedStableAmenities } = require('./seed-stable-amenities');
const { seedBoxAmenities } = require('./seed-box-amenities');

async function seedAllAmenities() {
  
  try {
    await seedStableAmenities();
    await seedBoxAmenities();
    
  } catch (error) {
    throw error;
  }
}

if (require.main === module) {
  seedAllAmenities()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = { seedAllAmenities };