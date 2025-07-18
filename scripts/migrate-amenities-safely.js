/**
 * SAFE MIGRATION SCRIPT
 * 
 * This script safely migrates from unified amenities to separate stable/box amenities
 * WITHOUT data loss. It preserves all existing relationships.
 * 
 * IMPORTANT: Run this AFTER the new schema is deployed but BEFORE using the new system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapping of amenities to their intended type
const AMENITY_MAPPING = {
  // Stable amenities (facility-level)
  'Ridehall': 'stable',
  'Springbane': 'stable', 
  'Dressurarena': 'stable',
  'Turstier': 'stable',
  'Veterinær': 'stable',
  'Parkering': 'stable',
  'Beite': 'stable',
  'Paddock': 'stable',
  'Solarium': 'stable',
  'Hestesvømming': 'stable',
  
  // Box amenities (box-specific)
  'Daglig utgang': 'box',
  'Vaskeboks': 'box',
  'Vannkran': 'box',
  'Strøm': 'box',
  'Oppvarming': 'box',
  'Automatisk vannsystem': 'box',
  'Gummimatte': 'box',
  'Høyring': 'box',
  'Kraftfôr inkludert': 'box',
  'Daglig tilsyn': 'box'
};

async function migrateAmenitiesSafely() {
  console.log('🚀 Starting safe amenity migration...');
  
  try {
    // Step 1: Check if old amenities table exists
    const oldAmenities = await prisma.amenity.findMany().catch(() => null);
    
    if (!oldAmenities) {
      console.log('✅ No old amenities found. Creating fresh amenities...');
      await seedNewAmenities();
      return;
    }
    
    console.log(`📊 Found ${oldAmenities.length} existing amenities to migrate`);
    
    // Step 2: Create new stable amenities
    console.log('📝 Creating stable amenities...');
    const stableAmenityMap = new Map();
    
    for (const [amenityName, type] of Object.entries(AMENITY_MAPPING)) {
      if (type === 'stable') {
        const existingOld = oldAmenities.find(a => a.name === amenityName);
        if (existingOld) {
          // Check if stable amenity already exists
          const existing = await prisma.stableAmenity.findFirst({
            where: { name: amenityName }
          });
          
          if (!existing) {
            const newStableAmenity = await prisma.stableAmenity.create({
              data: { name: amenityName }
            });
            stableAmenityMap.set(existingOld.id, newStableAmenity.id);
            console.log(`  ✅ Created stable amenity: ${amenityName}`);
          } else {
            stableAmenityMap.set(existingOld.id, existing.id);
            console.log(`  ♻️  Reused stable amenity: ${amenityName}`);
          }
        }
      }
    }
    
    // Step 3: Create new box amenities
    console.log('📝 Creating box amenities...');
    const boxAmenityMap = new Map();
    
    for (const [amenityName, type] of Object.entries(AMENITY_MAPPING)) {
      if (type === 'box') {
        const existingOld = oldAmenities.find(a => a.name === amenityName);
        if (existingOld) {
          // Check if box amenity already exists
          const existing = await prisma.boxAmenity.findFirst({
            where: { name: amenityName }
          });
          
          if (!existing) {
            const newBoxAmenity = await prisma.boxAmenity.create({
              data: { name: amenityName }
            });
            boxAmenityMap.set(existingOld.id, newBoxAmenity.id);
            console.log(`  ✅ Created box amenity: ${amenityName}`);
          } else {
            boxAmenityMap.set(existingOld.id, existing.id);
            console.log(`  ♻️  Reused box amenity: ${amenityName}`);
          }
        }
      }
    }
    
    // Step 4: Migrate stable-amenity relationships
    console.log('🔗 Migrating stable-amenity relationships...');
    const oldStableAmenities = await prisma.stableAmenity.findMany().catch(() => []);
    
    for (const oldRelation of oldStableAmenities) {
      const newAmenityId = stableAmenityMap.get(oldRelation.amenityId);
      if (newAmenityId) {
        // Check if relationship already exists
        const existing = await prisma.stableAmenityLink.findFirst({
          where: {
            stableId: oldRelation.stableId,
            amenityId: newAmenityId
          }
        });
        
        if (!existing) {
          await prisma.stableAmenityLink.create({
            data: {
              stableId: oldRelation.stableId,
              amenityId: newAmenityId
            }
          });
          console.log(`  ✅ Migrated stable relationship`);
        }
      }
    }
    
    // Step 5: Migrate box-amenity relationships
    console.log('🔗 Migrating box-amenity relationships...');
    const oldBoxAmenities = await prisma.boxAmenity.findMany().catch(() => []);
    
    for (const oldRelation of oldBoxAmenities) {
      const newAmenityId = boxAmenityMap.get(oldRelation.amenityId);
      if (newAmenityId) {
        // Check if relationship already exists
        const existing = await prisma.boxAmenityLink.findFirst({
          where: {
            boxId: oldRelation.boxId,
            amenityId: newAmenityId
          }
        });
        
        if (!existing) {
          await prisma.boxAmenityLink.create({
            data: {
              boxId: oldRelation.boxId,
              amenityId: newAmenityId
            }
          });
          console.log(`  ✅ Migrated box relationship`);
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Step 6: Verification
    const stableAmenityCount = await prisma.stableAmenity.count();
    const boxAmenityCount = await prisma.boxAmenity.count();
    const stableLinkCount = await prisma.stableAmenityLink.count();
    const boxLinkCount = await prisma.boxAmenityLink.count();
    
    console.log('\n📊 Migration Summary:');
    console.log(`  Stable amenities: ${stableAmenityCount}`);
    console.log(`  Box amenities: ${boxAmenityCount}`);
    console.log(`  Stable relationships: ${stableLinkCount}`);
    console.log(`  Box relationships: ${boxLinkCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function seedNewAmenities() {
  const stableAmenities = [
    'Ridehall', 'Springbane', 'Dressurarena', 'Turstier', 'Veterinær',
    'Parkering', 'Beite', 'Paddock', 'Solarium', 'Hestesvømming'
  ];
  
  const boxAmenities = [
    'Vannkran', 'Strøm', 'Daglig utgang', 'Vaskeboks', 'Oppvarming',
    'Automatisk vannsystem', 'Gummimatte', 'Høyring', 'Kraftfôr inkludert', 'Daglig tilsyn'
  ];
  
  for (const name of stableAmenities) {
    await prisma.stableAmenity.create({ data: { name } });
    console.log(`✅ Created stable amenity: ${name}`);
  }
  
  for (const name of boxAmenities) {
    await prisma.boxAmenity.create({ data: { name } });
    console.log(`✅ Created box amenity: ${name}`);
  }
}

if (require.main === module) {
  migrateAmenitiesSafely()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { migrateAmenitiesSafely };