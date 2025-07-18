const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const roadmapItems = [
  {
    title: 'Stall oppslagstavle',
    description: 'Stall eiere kan ha en oppslagstavle hvor de skriver oppdateringer som "neste helg er det rengjøring", arrangementer, og andre viktige beskjeder til sine leietakere.',
    category: 'Stall administrasjon',
    status: 'PLANNED',
    priority: 'HIGH',
    estimatedDate: new Date('2025-09-01'),
    sortOrder: 1,
    isPublic: true,
  },
  {
    title: 'Hest administrasjon',
    description: 'Brukere kan legge til sine hester og holde oversikt over veterinæravtaler, fôrtype, mengde fôr, og andre viktige detaljer om hesten sin.',
    category: 'Hest administrasjon',
    status: 'PLANNED',
    priority: 'HIGH',
    estimatedDate: new Date('2025-10-01'),
    sortOrder: 2,
    isPublic: true,
  },
  {
    title: 'Fremhevede staller',
    description: 'Staller kan betale en liten sum for å bli fremhevet på forsiden, noe som gir dem mer synlighet og økt sjanse for å få leietakere.',
    category: 'Markedsføring',
    status: 'PLANNED',
    priority: 'MEDIUM',
    estimatedDate: new Date('2025-11-01'),
    sortOrder: 3,
    isPublic: true,
  },
  {
    title: 'Avanserte søkefiltre',
    description: 'Mer avanserte søkefiltre som område, fasiliteter, pris, størrelse på bokser, og andre kriterier for å finne den perfekte stallen.',
    category: 'Søk og filtrering',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    estimatedDate: new Date('2025-08-15'),
    sortOrder: 4,
    isPublic: true,
  },
  {
    title: 'Mobil app',
    description: 'Dedikert mobil app for iOS og Android med alle funksjoner tilgjengelig på telefonen.',
    category: 'Mobil',
    status: 'PLANNED',
    priority: 'LOW',
    estimatedDate: new Date('2026-01-01'),
    sortOrder: 5,
    isPublic: true,
  },
  {
    title: 'Ratingsystem',
    description: 'Både stall eiere og leietakere kan gi hverandre rating og anmeldelser for å bygge tillit i samfunnet.',
    category: 'Samfunn',
    status: 'PLANNED',
    priority: 'MEDIUM',
    estimatedDate: new Date('2025-12-01'),
    sortOrder: 6,
    isPublic: true,
  },
];

async function main() {
  console.log('Seeding roadmap items...');
  
  for (const item of roadmapItems) {
    try {
      await prisma.roadmapItem.create({
        data: item,
      });
      console.log(`✓ Created roadmap item: ${item.title}`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`- Roadmap item already exists: ${item.title}`);
      } else {
        console.error(`✗ Error creating roadmap item ${item.title}:`, error);
      }
    }
  }
  
  console.log('Roadmap seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding roadmap:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });