import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Clear all pricing-related tables first to ensure clean seed data
  console.log("🧹 Clearing existing pricing data...");
  await prisma.boost_pricing_discounts.deleteMany({});
  console.log("✅ Pricing tables cleared");

  // Insert boost pricing discounts (updated to match actual schema)
  await prisma.boost_pricing_discounts.createMany({
    data: [
      { days: 3, percentage: 3.0, maxDays: 3 }, // 3% discount for 3 days
      { days: 7, percentage: 7.0, maxDays: 7 }, // 7% discount for 7 days  
      { days: 14, percentage: 15.0, maxDays: 14 }, // 15% discount for 14 days
    ],
    skipDuplicates: true,
  });

  // Insert Norwegian counties (2024 structure)
  await prisma.counties.createMany({
    data: [
      { name: "Oslo", countyNumber: "03" },
      { name: "Rogaland", countyNumber: "11" },
      { name: "Møre og Romsdal", countyNumber: "15" },
      { name: "Nordland", countyNumber: "18" },
      { name: "Østfold", countyNumber: "31" },
      { name: "Akershus", countyNumber: "32" },
      { name: "Buskerud", countyNumber: "33" },
      { name: "Innlandet", countyNumber: "34" },
      { name: "Vestfold", countyNumber: "39" },
      { name: "Telemark", countyNumber: "40" },
      { name: "Agder", countyNumber: "42" },
      { name: "Vestland", countyNumber: "46" },
      { name: "Trøndelag", countyNumber: "50" },
      { name: "Troms", countyNumber: "55" },
      { name: "Finnmark", countyNumber: "56" },
    ],
    skipDuplicates: true,
  });

  // Get county IDs for municipalities
  const osloCounty = await prisma.counties.findUnique({ where: { countyNumber: "03" } });
  const akershusCounty = await prisma.counties.findUnique({ where: { countyNumber: "32" } });

  if (osloCounty) {
    // Insert sample municipalities for Oslo
    await prisma.municipalities.createMany({
      data: [
        { name: "Oslo", municipalityNumber: "0301", countyId: osloCounty.id },
      ],
      skipDuplicates: true,
    });
  }

  if (akershusCounty) {
    // Insert sample municipalities for Akershus
    await prisma.municipalities.createMany({
      data: [
        { name: "Bærum", municipalityNumber: "3201", countyId: akershusCounty.id },
        { name: "Asker", municipalityNumber: "3202", countyId: akershusCounty.id },
        { name: "Lillestrøm", municipalityNumber: "3203", countyId: akershusCounty.id },
      ],
      skipDuplicates: true,
    });
  }

  // Insert stable amenities
  await prisma.stable_amenities.createMany({
    data: [
      { name: "Innendørs ridering" },
      { name: "Utendørs ridebane" },
      { name: "Lysløype/belyste stier" },
      { name: "Utfôring" },
      { name: "Manuell gjødselkjøring" },
      { name: "Paddock/utegang" },
      { name: "Oppstalling av tilhenger" },
      { name: "Oppstalling av bil" },
      { name: "Toalett" },
      { name: "Dusj" },
      { name: "Kantine/pauserom" },
      { name: "Sadelkammer" },
    ],
    skipDuplicates: true,
  });

  // Insert box amenities
  await prisma.box_amenities.createMany({
    data: [
      { name: "Automatisk vannsystem" },
      { name: "Strøm i boksen" },
      { name: "Ekstra stor boks" },
      { name: "Tilgang til paddock" },
      { name: "Isolert boks" },
      { name: "Gummimatter" },
    ],
    skipDuplicates: true,
  });

  // Insert service types
  await prisma.service_types.createMany({
    data: [
      { name: "veterinarian", displayName: "Veterinær" },
      { name: "farrier", displayName: "Hovslagare" },
      { name: "trainer", displayName: "Trener/Rideinstruktør" },
      { name: "physiotherapist", displayName: "Fysioterapeut" },
      { name: "transport", displayName: "Hestetransport" },
      { name: "dentist", displayName: "Hestetannlege" },
      { name: "chiropractor", displayName: "Kiropraktor" },
      { name: "photographer", displayName: "Fotograf" },
      { name: "other", displayName: "Annet" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Database seeded successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });