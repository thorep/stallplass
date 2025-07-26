import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Insert base pricing data
  await prisma.base_prices.createMany({
    data: [
      {
        name: 'Standard listing',
        price: 299,
        description: 'Monthly fee for standard stable listing',
        updatedAt: new Date()
      },
      {
        name: 'Featured listing',
        price: 499,
        description: 'Monthly fee for featured stable listing with extra visibility',
        updatedAt: new Date()
      }
    ],
    skipDuplicates: true
  })
  console.log('✅ Base prices seeded')

  // Insert pricing discounts
  await prisma.pricing_discounts.createMany({
    data: [
      { months: 3, percentage: 10.0, updatedAt: new Date() },
      { months: 6, percentage: 15.0, updatedAt: new Date() },
      { months: 12, percentage: 20.0, updatedAt: new Date() }
    ],
    skipDuplicates: true
  })
  console.log('✅ Pricing discounts seeded')

  // Insert Norwegian counties
  await prisma.counties.createMany({
    data: [
      { name: 'Oslo', countyNumber: '03' },
      { name: 'Rogaland', countyNumber: '11' },
      { name: 'Møre og Romsdal', countyNumber: '15' },
      { name: 'Nordland', countyNumber: '18' },
      { name: 'Viken', countyNumber: '30' },
      { name: 'Østfold', countyNumber: '31' },
      { name: 'Akershus', countyNumber: '32' },
      { name: 'Buskerud', countyNumber: '33' },
      { name: 'Innlandet', countyNumber: '34' },
      { name: 'Vestfold', countyNumber: '39' },
      { name: 'Telemark', countyNumber: '40' },
      { name: 'Agder', countyNumber: '42' },
      { name: 'Vestland', countyNumber: '46' },
      { name: 'Trøndelag', countyNumber: '50' },
      { name: 'Troms', countyNumber: '54' },
      { name: 'Finnmark', countyNumber: '56' }
    ],
    skipDuplicates: true
  })
  console.log('✅ Counties seeded')

  // Get county IDs for municipalities
  const osloCounty = await prisma.counties.findUnique({ where: { countyNumber: '03' } })
  const rogalandCounty = await prisma.counties.findUnique({ where: { countyNumber: '11' } })
  const moreRomsdalCounty = await prisma.counties.findUnique({ where: { countyNumber: '15' } })
  const nordlandCounty = await prisma.counties.findUnique({ where: { countyNumber: '18' } })
  const vikenCounty = await prisma.counties.findUnique({ where: { countyNumber: '30' } })
  const agderCounty = await prisma.counties.findUnique({ where: { countyNumber: '42' } })
  const vestlandCounty = await prisma.counties.findUnique({ where: { countyNumber: '46' } })
  const trondelagCounty = await prisma.counties.findUnique({ where: { countyNumber: '50' } })
  const tromsCounty = await prisma.counties.findUnique({ where: { countyNumber: '54' } })

  // Insert major municipalities for testing
  // NOTE: This is a subset of the 357 total municipalities in Norway
  // Add more municipalities as needed from: https://www.kartverket.no/til-lands/fakta-om-norge/norske-fylke-og-kommunar
  await prisma.municipalities.createMany({
    data: [
      // Oslo
      { name: 'Oslo', municipalityNumber: '0301', countyId: osloCounty!.id },
      
      // Rogaland
      { name: 'Stavanger', municipalityNumber: '1103', countyId: rogalandCounty!.id },
      { name: 'Sandnes', municipalityNumber: '1108', countyId: rogalandCounty!.id },
      { name: 'Haugesund', municipalityNumber: '1106', countyId: rogalandCounty!.id },
      
      // Møre og Romsdal  
      { name: 'Ålesund', municipalityNumber: '1507', countyId: moreRomsdalCounty!.id },
      { name: 'Molde', municipalityNumber: '1506', countyId: moreRomsdalCounty!.id },
      
      // Nordland
      { name: 'Bodø', municipalityNumber: '1804', countyId: nordlandCounty!.id },
      { name: 'Narvik', municipalityNumber: '1806', countyId: nordlandCounty!.id },
      
      // Viken
      { name: 'Fredrikstad', municipalityNumber: '3001', countyId: vikenCounty!.id },
      { name: 'Drammen', municipalityNumber: '3005', countyId: vikenCounty!.id },
      { name: 'Asker', municipalityNumber: '3203', countyId: vikenCounty!.id },
      { name: 'Bærum', municipalityNumber: '3205', countyId: vikenCounty!.id },
      
      // Agder
      { name: 'Kristiansand', municipalityNumber: '4204', countyId: agderCounty!.id },
      { name: 'Arendal', municipalityNumber: '4203', countyId: agderCounty!.id },
      
      // Vestland
      { name: 'Bergen', municipalityNumber: '4601', countyId: vestlandCounty!.id },
      { name: 'Stavanger', municipalityNumber: '4602', countyId: vestlandCounty!.id },
      
      // Trøndelag
      { name: 'Trondheim', municipalityNumber: '5001', countyId: trondelagCounty!.id },
      { name: 'Steinkjer', municipalityNumber: '5006', countyId: trondelagCounty!.id },
      
      // Troms
      { name: 'Tromsø', municipalityNumber: '5401', countyId: tromsCounty!.id },
      { name: 'Harstad', municipalityNumber: '5402', countyId: tromsCounty!.id }
    ],
    skipDuplicates: true
  })
  console.log('✅ Municipalities seeded')

  // Insert stable amenities
  const stableAmenities = [
    'Innebane',
    'Utebane',
    'Beredesbane',
    'Longebane',
    'Solarium',
    'Vaskehall',
    'Beiteområde',
    'Hestetrailer parkering',
    'Bilparkering',
    'Oppredningsrom',
    'Salebod',
    'Stallkafé',
    'Sosialrom',
    'Toalett',
    'Dusj',
    '24/7 tilgang',
    'Videoovervåkning',
    'Automatkasse',
    'Førkjøring',
    'Hestepass service'
  ]

  await prisma.stable_amenities.createMany({
    data: stableAmenities.map(name => ({ name })),
    skipDuplicates: true
  })
  console.log('✅ Stable amenities seeded')

  // Insert box amenities
  const boxAmenities = [
    'Stort rom',
    'Middels rom',
    'Lite rom',
    'Vindu',
    'Strøm',
    'Vann',
    'Oppvarming',
    'Gummimatter',
    'Høybed',
    'Automatisk vanningsystem',
    'Daglig stell inkludert',
    'Kraftfôr inkludert',
    'Høy inkludert',
    'Helger og ferier dekket',
    'Dyrlege service'
  ]

  await prisma.box_amenities.createMany({
    data: boxAmenities.map(name => ({ name })),
    skipDuplicates: true
  })
  console.log('✅ Box amenities seeded')

  // Insert roadmap items
  await prisma.roadmap_items.createMany({
    data: [
      {
        title: 'Mobile App',
        description: 'Develop native mobile applications for iOS and Android',
        category: 'Mobile',
        status: 'PLANNED',
        priority: 'HIGH',
        isPublic: true,
        updatedAt: new Date()
      },
      {
        title: 'Advanced Search Filters',
        description: 'Add more granular search options including price ranges, amenities, and location radius',
        category: 'Platform',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        isPublic: true,
        updatedAt: new Date()
      },
      {
        title: 'Payment Integration',
        description: 'Integrate multiple payment providers including Stripe and Klarna',
        category: 'Payments',
        status: 'COMPLETED',
        priority: 'HIGH',
        isPublic: true,
        updatedAt: new Date()
      },
      {
        title: 'Review System',
        description: 'Two-way review system between stable owners and renters',
        category: 'Social',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        isPublic: true,
        updatedAt: new Date()
      },
      {
        title: 'Real-time Chat',
        description: 'In-app messaging between users and stable owners',
        category: 'Communication',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        isPublic: true,
        updatedAt: new Date()
      }
    ],
    skipDuplicates: true
  })
  console.log('✅ Roadmap items seeded')

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })