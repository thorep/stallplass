import { prisma } from './src/services/prisma';

async function checkMunicipalities() {
  try {
    // Count municipalities
    const count = await prisma.municipalities.count();
    console.log('Total municipalities in database:', count);
    
    // Check for specific kommune number
    const sandefjord = await prisma.municipalities.findFirst({
      where: {
        OR: [
          { municipalityNumber: '3907' },
          { municipalityNumber: '3804' }, // Old Sandefjord number
          { name: { contains: 'Sandefjord', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log('Sandefjord municipality:', sandefjord);
    
    // List first 10 municipalities
    const samples = await prisma.municipalities.findMany({
      take: 10,
      include: {
        counties: true
      }
    });
    
    console.log('\nFirst 10 municipalities:');
    samples.forEach(m => {
      console.log(`- ${m.name} (${m.municipalityNumber}) in ${m.counties?.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMunicipalities();