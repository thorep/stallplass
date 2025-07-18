/**
 * ROLLBACK SCRIPT
 * 
 * This script can rollback the amenity migration if needed.
 * It will restore the old unified amenity system.
 * 
 * USE WITH CAUTION: Only run this if you need to rollback the migration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function rollbackAmenities() {
  console.log('⚠️  Starting amenity rollback...');
  console.log('   This will restore the old unified amenity system');
  
  try {
    // Step 1: Recreate unified amenities from separate ones
    console.log('📝 Recreating unified amenities...');
    
    const stableAmenities = await prisma.stableAmenity.findMany();
    const boxAmenities = await prisma.boxAmenity.findMany();
    
    const allAmenityNames = [
      ...stableAmenities.map(a => a.name),
      ...boxAmenities.map(a => a.name)
    ];
    
    const uniqueNames = [...new Set(allAmenityNames)];
    
    for (const name of uniqueNames) {
      const existing = await prisma.amenity.findFirst({ where: { name } });
      if (!existing) {
        await prisma.amenity.create({ data: { name } });
        console.log(`  ✅ Restored amenity: ${name}`);
      }
    }
    
    // Step 2: Restore stable relationships
    console.log('🔗 Restoring stable relationships...');
    const stableLinks = await prisma.stableAmenityLink.findMany({
      include: { amenity: true }
    });
    
    for (const link of stableLinks) {
      const unifiedAmenity = await prisma.amenity.findFirst({
        where: { name: link.amenity.name }
      });
      
      if (unifiedAmenity) {
        const existing = await prisma.stableAmenity.findFirst({
          where: {
            stableId: link.stableId,
            amenityId: unifiedAmenity.id
          }
        });
        
        if (!existing) {
          await prisma.stableAmenity.create({
            data: {
              stableId: link.stableId,
              amenityId: unifiedAmenity.id
            }
          });
        }
      }
    }
    
    // Step 3: Restore box relationships
    console.log('🔗 Restoring box relationships...');
    const boxLinks = await prisma.boxAmenityLink.findMany({
      include: { amenity: true }
    });
    
    for (const link of boxLinks) {
      const unifiedAmenity = await prisma.amenity.findFirst({
        where: { name: link.amenity.name }
      });
      
      if (unifiedAmenity) {
        const existing = await prisma.boxAmenity.findFirst({
          where: {
            boxId: link.boxId,
            amenityId: unifiedAmenity.id
          }
        });
        
        if (!existing) {
          await prisma.boxAmenity.create({
            data: {
              boxId: link.boxId,
              amenityId: unifiedAmenity.id
            }
          });
        }
      }
    }
    
    console.log('✅ Rollback completed successfully!');
    
    // Verification
    const amenityCount = await prisma.amenity.count();
    const stableRelCount = await prisma.stableAmenity.count();
    const boxRelCount = await prisma.boxAmenity.count();
    
    console.log('\n📊 Rollback Summary:');
    console.log(`  Unified amenities: ${amenityCount}`);
    console.log(`  Stable relationships: ${stableRelCount}`);
    console.log(`  Box relationships: ${boxRelCount}`);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

if (require.main === module) {
  rollbackAmenities()
    .then(() => {
      console.log('🎉 Rollback completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Rollback failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { rollbackAmenities };