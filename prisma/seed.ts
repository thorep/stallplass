import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Clear all pricing-related tables first to ensure clean seed data
  console.log("🧹 Clearing existing pricing data...");
  await prisma.pricing_discounts.deleteMany({});
  await prisma.service_pricing_discounts.deleteMany({});
  await prisma.boost_pricing_discounts.deleteMany({});
  await prisma.box_quantity_discounts.deleteMany({});
  await prisma.base_prices.deleteMany({});
  console.log("✅ Pricing tables cleared");

  // Insert base pricing data
  await prisma.base_prices.createMany({
    data: [
      {
        name: "Box advertising",
        price: 39,
        description: "Monthly base price for box advertising",
        updatedAt: new Date(),
      },
      {
        name: "Box boost",
        price: 3,
        description: "Daily price for box boost placement per box",
        updatedAt: new Date(),
      },
      {
        name: "Service base",
        price: 149,
        description: "Monthly base price for service listings",
        updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  // Insert box advertising pricing discounts (monthly)
  await prisma.pricing_discounts.createMany({
    data: [
      { months: 3, percentage: 5.0, updatedAt: new Date() }, // 5% discount for 3 months
      { months: 6, percentage: 12.0, updatedAt: new Date() }, // 12% discount for 6 months
      { months: 12, percentage: 15.0, updatedAt: new Date() }, // 15% discount for 12 months
    ],
    skipDuplicates: true,
  });

  // Insert service pricing discounts (monthly)
  await prisma.service_pricing_discounts.createMany({
    data: [
      { months: 1, percentage: 0.0, updatedAt: new Date() }, // No discount for 1 month
      { months: 3, percentage: 5.0, updatedAt: new Date() }, // 5% discount for 3 months
      { months: 6, percentage: 10.0, updatedAt: new Date() }, // 10% discount for 6 months
      { months: 12, percentage: 15.0, updatedAt: new Date() }, // 15% discount for 12 months
    ],
    skipDuplicates: true,
  });

  // Insert box boost pricing discounts (daily)
  await prisma.boost_pricing_discounts.createMany({
    data: [
      { days: 7, maxDays: 13, percentage: 5.0, updatedAt: new Date() }, // 5% discount for 7-13 days
      { days: 14, maxDays: 29, percentage: 10.0, updatedAt: new Date() }, // 10% discount for 14-29 days
      { days: 30, maxDays: null, percentage: 15.0, updatedAt: new Date() }, // 15% discount for 30+ days
    ],
    skipDuplicates: true,
  });

  // Insert box quantity discounts (bulk advertising)
  await prisma.box_quantity_discounts.createMany({
    data: [
      { minBoxes: 5, maxBoxes: 9, discountPercentage: 10.0, updatedAt: new Date() }, // 10% discount for 5-9 boxes
      { minBoxes: 10, maxBoxes: 14, discountPercentage: 15.0, updatedAt: new Date() }, // 15% discount for 10-14 boxes
      { minBoxes: 15, maxBoxes: null, discountPercentage: 20.0, updatedAt: new Date() }, // 20% discount for 15+ boxes
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
  const rogalandCounty = await prisma.counties.findUnique({ where: { countyNumber: "11" } });
  const moreRomsdalCounty = await prisma.counties.findUnique({ where: { countyNumber: "15" } });
  const nordlandCounty = await prisma.counties.findUnique({ where: { countyNumber: "18" } });
  const ostfoldCounty = await prisma.counties.findUnique({ where: { countyNumber: "31" } });
  const akershusCounty = await prisma.counties.findUnique({ where: { countyNumber: "32" } });
  const buskerudCounty = await prisma.counties.findUnique({ where: { countyNumber: "33" } });
  const innlandetCounty = await prisma.counties.findUnique({ where: { countyNumber: "34" } });
  const vestfoldCounty = await prisma.counties.findUnique({ where: { countyNumber: "39" } });
  const telemarkCounty = await prisma.counties.findUnique({ where: { countyNumber: "40" } });
  const agderCounty = await prisma.counties.findUnique({ where: { countyNumber: "42" } });
  const vestlandCounty = await prisma.counties.findUnique({ where: { countyNumber: "46" } });
  const trondelagCounty = await prisma.counties.findUnique({ where: { countyNumber: "50" } });
  const tromsCounty = await prisma.counties.findUnique({ where: { countyNumber: "55" } });
  const finnmarkCounty = await prisma.counties.findUnique({ where: { countyNumber: "56" } });

  // Insert all Norwegian municipalities (complete list as of 2024)
  await prisma.municipalities.createMany({
    data: [
      // Oslo (03)
      { name: "Oslo", municipalityNumber: "0301", countyId: osloCounty!.id },

      // Rogaland (11)
      { name: "Haugesund", municipalityNumber: "1106", countyId: rogalandCounty!.id },
      { name: "Stavanger", municipalityNumber: "1103", countyId: rogalandCounty!.id },
      { name: "Sandnes", municipalityNumber: "1108", countyId: rogalandCounty!.id },
      { name: "Randaberg", municipalityNumber: "1127", countyId: rogalandCounty!.id },
      { name: "Strand", municipalityNumber: "1130", countyId: rogalandCounty!.id },
      { name: "Hjelmeland", municipalityNumber: "1133", countyId: rogalandCounty!.id },
      { name: "Suldal", municipalityNumber: "1134", countyId: rogalandCounty!.id },
      { name: "Sauda", municipalityNumber: "1135", countyId: rogalandCounty!.id },
      { name: "Kvitsøy", municipalityNumber: "1144", countyId: rogalandCounty!.id },
      { name: "Bokn", municipalityNumber: "1145", countyId: rogalandCounty!.id },
      { name: "Tysvær", municipalityNumber: "1146", countyId: rogalandCounty!.id },
      { name: "Karmøy", municipalityNumber: "1149", countyId: rogalandCounty!.id },
      { name: "Utsira", municipalityNumber: "1151", countyId: rogalandCounty!.id },
      { name: "Vindafjord", municipalityNumber: "1160", countyId: rogalandCounty!.id },
      { name: "Bjerkreim", municipalityNumber: "1114", countyId: rogalandCounty!.id },
      { name: "Eigersund", municipalityNumber: "1101", countyId: rogalandCounty!.id },
      { name: "Sokndal", municipalityNumber: "1111", countyId: rogalandCounty!.id },
      { name: "Lund", municipalityNumber: "1112", countyId: rogalandCounty!.id },
      { name: "Hå", municipalityNumber: "1119", countyId: rogalandCounty!.id },
      { name: "Klepp", municipalityNumber: "1120", countyId: rogalandCounty!.id },
      { name: "Time", municipalityNumber: "1121", countyId: rogalandCounty!.id },
      { name: "Gjesdal", municipalityNumber: "1122", countyId: rogalandCounty!.id },
      { name: "Sola", municipalityNumber: "1124", countyId: rogalandCounty!.id },

      // Møre og Romsdal (15)
      { name: "Kristiansund", municipalityNumber: "1505", countyId: moreRomsdalCounty!.id },
      { name: "Molde", municipalityNumber: "1506", countyId: moreRomsdalCounty!.id },
      { name: "Ålesund", municipalityNumber: "1508", countyId: moreRomsdalCounty!.id },
      { name: "Vanylven", municipalityNumber: "1511", countyId: moreRomsdalCounty!.id },
      { name: "Sande", municipalityNumber: "1514", countyId: moreRomsdalCounty!.id },
      { name: "Herøy (Møre og Romsdal)", municipalityNumber: "1515", countyId: moreRomsdalCounty!.id },
      { name: "Ulstein", municipalityNumber: "1516", countyId: moreRomsdalCounty!.id },
      { name: "Hareid", municipalityNumber: "1517", countyId: moreRomsdalCounty!.id },
      { name: "Ørsta", municipalityNumber: "1520", countyId: moreRomsdalCounty!.id },
      { name: "Stranda", municipalityNumber: "1525", countyId: moreRomsdalCounty!.id },
      { name: "Sykkylven", municipalityNumber: "1528", countyId: moreRomsdalCounty!.id },
      { name: "Sula", municipalityNumber: "1531", countyId: moreRomsdalCounty!.id },
      { name: "Giske", municipalityNumber: "1532", countyId: moreRomsdalCounty!.id },
      { name: "Vestnes", municipalityNumber: "1535", countyId: moreRomsdalCounty!.id },
      { name: "Rauma", municipalityNumber: "1539", countyId: moreRomsdalCounty!.id },
      { name: "Aukra", municipalityNumber: "1547", countyId: moreRomsdalCounty!.id },
      { name: "Averøy", municipalityNumber: "1554", countyId: moreRomsdalCounty!.id },
      { name: "Gjemnes", municipalityNumber: "1557", countyId: moreRomsdalCounty!.id },
      { name: "Tingvoll", municipalityNumber: "1560", countyId: moreRomsdalCounty!.id },
      { name: "Sunndal", municipalityNumber: "1563", countyId: moreRomsdalCounty!.id },
      { name: "Surnadal", municipalityNumber: "1566", countyId: moreRomsdalCounty!.id },
      { name: "Smøla", municipalityNumber: "1573", countyId: moreRomsdalCounty!.id },
      { name: "Aure", municipalityNumber: "1576", countyId: moreRomsdalCounty!.id },
      { name: "Volda", municipalityNumber: "1577", countyId: moreRomsdalCounty!.id },
      { name: "Fjord", municipalityNumber: "1578", countyId: moreRomsdalCounty!.id },
      { name: "Hustadvika", municipalityNumber: "1579", countyId: moreRomsdalCounty!.id },
      { name: "Haram", municipalityNumber: "1580", countyId: moreRomsdalCounty!.id },

      // Nordland (18)
      { name: "Bodø", municipalityNumber: "1804", countyId: nordlandCounty!.id },
      { name: "Narvik", municipalityNumber: "1806", countyId: nordlandCounty!.id },
      { name: "Bindal", municipalityNumber: "1811", countyId: nordlandCounty!.id },
      { name: "Sømna", municipalityNumber: "1812", countyId: nordlandCounty!.id },
      { name: "Brønnøy", municipalityNumber: "1813", countyId: nordlandCounty!.id },
      { name: "Vega", municipalityNumber: "1815", countyId: nordlandCounty!.id },
      { name: "Vevelstad", municipalityNumber: "1816", countyId: nordlandCounty!.id },
      { name: "Herøy (Nordland)", municipalityNumber: "1818", countyId: nordlandCounty!.id },
      { name: "Alstahaug", municipalityNumber: "1820", countyId: nordlandCounty!.id },
      { name: "Leirfjord", municipalityNumber: "1822", countyId: nordlandCounty!.id },
      { name: "Vefsn", municipalityNumber: "1824", countyId: nordlandCounty!.id },
      { name: "Grane", municipalityNumber: "1825", countyId: nordlandCounty!.id },
      { name: "Hattfjelldal", municipalityNumber: "1826", countyId: nordlandCounty!.id },
      { name: "Dønna", municipalityNumber: "1827", countyId: nordlandCounty!.id },
      { name: "Nesna", municipalityNumber: "1828", countyId: nordlandCounty!.id },
      { name: "Hemnes", municipalityNumber: "1832", countyId: nordlandCounty!.id },
      { name: "Rana", municipalityNumber: "1833", countyId: nordlandCounty!.id },
      { name: "Lurøy", municipalityNumber: "1834", countyId: nordlandCounty!.id },
      { name: "Træna", municipalityNumber: "1835", countyId: nordlandCounty!.id },
      { name: "Rødøy", municipalityNumber: "1836", countyId: nordlandCounty!.id },
      { name: "Meløy", municipalityNumber: "1837", countyId: nordlandCounty!.id },
      { name: "Gildeskål", municipalityNumber: "1838", countyId: nordlandCounty!.id },
      { name: "Beiarn", municipalityNumber: "1839", countyId: nordlandCounty!.id },
      { name: "Saltdal", municipalityNumber: "1840", countyId: nordlandCounty!.id },
      { name: "Fauske - Fuosko", municipalityNumber: "1841", countyId: nordlandCounty!.id },
      { name: "Sørfold", municipalityNumber: "1845", countyId: nordlandCounty!.id },
      { name: "Steigen", municipalityNumber: "1848", countyId: nordlandCounty!.id },
      { name: "Lødingen", municipalityNumber: "1851", countyId: nordlandCounty!.id },
      { name: "Evenes", municipalityNumber: "1853", countyId: nordlandCounty!.id },
      { name: "Røst", municipalityNumber: "1856", countyId: nordlandCounty!.id },
      { name: "Værøy", municipalityNumber: "1857", countyId: nordlandCounty!.id },
      { name: "Flakstad", municipalityNumber: "1859", countyId: nordlandCounty!.id },
      { name: "Vestvågøy", municipalityNumber: "1860", countyId: nordlandCounty!.id },
      { name: "Vågan", municipalityNumber: "1865", countyId: nordlandCounty!.id },
      { name: "Hadsel", municipalityNumber: "1866", countyId: nordlandCounty!.id },
      { name: "Bø", municipalityNumber: "1867", countyId: nordlandCounty!.id },
      { name: "Øksnes", municipalityNumber: "1868", countyId: nordlandCounty!.id },
      { name: "Sortland - Suortá", municipalityNumber: "1870", countyId: nordlandCounty!.id },
      { name: "Andøy", municipalityNumber: "1871", countyId: nordlandCounty!.id },
      { name: "Moskenes", municipalityNumber: "1874", countyId: nordlandCounty!.id },
      { name: "Hamarøy", municipalityNumber: "1875", countyId: nordlandCounty!.id },

      // Østfold (31)
      { name: "Halden", municipalityNumber: "3101", countyId: ostfoldCounty!.id },
      { name: "Moss", municipalityNumber: "3103", countyId: ostfoldCounty!.id },
      { name: "Sarpsborg", municipalityNumber: "3105", countyId: ostfoldCounty!.id },
      { name: "Fredrikstad", municipalityNumber: "3107", countyId: ostfoldCounty!.id },
      { name: "Hvaler", municipalityNumber: "3110", countyId: ostfoldCounty!.id },
      { name: "Råde", municipalityNumber: "3112", countyId: ostfoldCounty!.id },
      { name: "Våler", municipalityNumber: "3114", countyId: ostfoldCounty!.id },
      { name: "Skiptvet", municipalityNumber: "3116", countyId: ostfoldCounty!.id },
      { name: "Indre Østfold", municipalityNumber: "3118", countyId: ostfoldCounty!.id },
      { name: "Rakkestad", municipalityNumber: "3120", countyId: ostfoldCounty!.id },
      { name: "Marker", municipalityNumber: "3122", countyId: ostfoldCounty!.id },
      { name: "Aremark", municipalityNumber: "3124", countyId: ostfoldCounty!.id },

      // Akershus (32)
      { name: "Bærum", municipalityNumber: "3201", countyId: akershusCounty!.id },
      { name: "Asker", municipalityNumber: "3203", countyId: akershusCounty!.id },
      { name: "Lillestrøm", municipalityNumber: "3205", countyId: akershusCounty!.id },
      { name: "Nordre Follo", municipalityNumber: "3207", countyId: akershusCounty!.id },
      { name: "Ullensaker", municipalityNumber: "3209", countyId: akershusCounty!.id },
      { name: "Nesodden", municipalityNumber: "3212", countyId: akershusCounty!.id },
      { name: "Frogn", municipalityNumber: "3214", countyId: akershusCounty!.id },
      { name: "Vestby", municipalityNumber: "3216", countyId: akershusCounty!.id },
      { name: "Ås", municipalityNumber: "3218", countyId: akershusCounty!.id },
      { name: "Enebakk", municipalityNumber: "3220", countyId: akershusCounty!.id },
      { name: "Lørenskog", municipalityNumber: "3222", countyId: akershusCounty!.id },
      { name: "Rælingen", municipalityNumber: "3224", countyId: akershusCounty!.id },
      { name: "Aurskog-Høland", municipalityNumber: "3226", countyId: akershusCounty!.id },
      { name: "Nes", municipalityNumber: "3228", countyId: akershusCounty!.id },
      { name: "Gjerdrum", municipalityNumber: "3230", countyId: akershusCounty!.id },
      { name: "Nittedal", municipalityNumber: "3232", countyId: akershusCounty!.id },
      { name: "Lunner", municipalityNumber: "3234", countyId: akershusCounty!.id },
      { name: "Jevnaker", municipalityNumber: "3236", countyId: akershusCounty!.id },
      { name: "Nannestad", municipalityNumber: "3238", countyId: akershusCounty!.id },
      { name: "Eidsvoll", municipalityNumber: "3240", countyId: akershusCounty!.id },
      { name: "Hurdal", municipalityNumber: "3242", countyId: akershusCounty!.id },

      // Buskerud (33)
      { name: "Drammen", municipalityNumber: "3301", countyId: buskerudCounty!.id },
      { name: "Kongsberg", municipalityNumber: "3303", countyId: buskerudCounty!.id },
      { name: "Ringerike", municipalityNumber: "3305", countyId: buskerudCounty!.id },
      { name: "Hole", municipalityNumber: "3310", countyId: buskerudCounty!.id },
      { name: "Lier", municipalityNumber: "3312", countyId: buskerudCounty!.id },
      { name: "Øvre Eiker", municipalityNumber: "3314", countyId: buskerudCounty!.id },
      { name: "Modum", municipalityNumber: "3316", countyId: buskerudCounty!.id },
      { name: "Krødsherad", municipalityNumber: "3318", countyId: buskerudCounty!.id },
      { name: "Flå", municipalityNumber: "3320", countyId: buskerudCounty!.id },
      { name: "Nesbyen", municipalityNumber: "3322", countyId: buskerudCounty!.id },
      { name: "Gol", municipalityNumber: "3324", countyId: buskerudCounty!.id },
      { name: "Hemsedal", municipalityNumber: "3326", countyId: buskerudCounty!.id },
      { name: "Ål", municipalityNumber: "3328", countyId: buskerudCounty!.id },
      { name: "Hol", municipalityNumber: "3330", countyId: buskerudCounty!.id },
      { name: "Sigdal", municipalityNumber: "3332", countyId: buskerudCounty!.id },
      { name: "Flesberg", municipalityNumber: "3334", countyId: buskerudCounty!.id },
      { name: "Rollag", municipalityNumber: "3336", countyId: buskerudCounty!.id },
      { name: "Nore og Uvdal", municipalityNumber: "3338", countyId: buskerudCounty!.id },

      // Innlandet (34)
      { name: "Kongsvinger", municipalityNumber: "3401", countyId: innlandetCounty!.id },
      { name: "Hamar", municipalityNumber: "3403", countyId: innlandetCounty!.id },
      { name: "Lillehammer", municipalityNumber: "3405", countyId: innlandetCounty!.id },
      { name: "Gjøvik", municipalityNumber: "3407", countyId: innlandetCounty!.id },
      { name: "Ringsaker", municipalityNumber: "3411", countyId: innlandetCounty!.id },
      { name: "Løten", municipalityNumber: "3412", countyId: innlandetCounty!.id },
      { name: "Stange", municipalityNumber: "3413", countyId: innlandetCounty!.id },
      { name: "Nord-Odal", municipalityNumber: "3414", countyId: innlandetCounty!.id },
      { name: "Sør-Odal", municipalityNumber: "3415", countyId: innlandetCounty!.id },
      { name: "Eidskog", municipalityNumber: "3416", countyId: innlandetCounty!.id },
      { name: "Grue", municipalityNumber: "3417", countyId: innlandetCounty!.id },
      { name: "Åsnes", municipalityNumber: "3418", countyId: innlandetCounty!.id },
      { name: "Våler (Innlandet)", municipalityNumber: "3419", countyId: innlandetCounty!.id },
      { name: "Elverum", municipalityNumber: "3420", countyId: innlandetCounty!.id },
      { name: "Trysil", municipalityNumber: "3421", countyId: innlandetCounty!.id },
      { name: "Åmot", municipalityNumber: "3422", countyId: innlandetCounty!.id },
      { name: "Stor-Elvdal", municipalityNumber: "3423", countyId: innlandetCounty!.id },
      { name: "Rendalen", municipalityNumber: "3424", countyId: innlandetCounty!.id },
      { name: "Engerdal", municipalityNumber: "3425", countyId: innlandetCounty!.id },
      { name: "Tolga", municipalityNumber: "3426", countyId: innlandetCounty!.id },
      { name: "Tynset", municipalityNumber: "3427", countyId: innlandetCounty!.id },
      { name: "Alvdal", municipalityNumber: "3428", countyId: innlandetCounty!.id },
      { name: "Folldal", municipalityNumber: "3429", countyId: innlandetCounty!.id },
      { name: "Os", municipalityNumber: "3430", countyId: innlandetCounty!.id },
      { name: "Dovre", municipalityNumber: "3431", countyId: innlandetCounty!.id },
      { name: "Lesja", municipalityNumber: "3432", countyId: innlandetCounty!.id },
      { name: "Skjåk", municipalityNumber: "3433", countyId: innlandetCounty!.id },
      { name: "Lom", municipalityNumber: "3434", countyId: innlandetCounty!.id },
      { name: "Vågå", municipalityNumber: "3435", countyId: innlandetCounty!.id },
      { name: "Nord-Fron", municipalityNumber: "3436", countyId: innlandetCounty!.id },
      { name: "Sel", municipalityNumber: "3437", countyId: innlandetCounty!.id },
      { name: "Sør-Fron", municipalityNumber: "3438", countyId: innlandetCounty!.id },
      { name: "Ringebu", municipalityNumber: "3439", countyId: innlandetCounty!.id },
      { name: "Øyer", municipalityNumber: "3440", countyId: innlandetCounty!.id },
      { name: "Gausdal", municipalityNumber: "3441", countyId: innlandetCounty!.id },
      { name: "Østre Toten", municipalityNumber: "3442", countyId: innlandetCounty!.id },
      { name: "Vestre Toten", municipalityNumber: "3443", countyId: innlandetCounty!.id },
      { name: "Gran", municipalityNumber: "3446", countyId: innlandetCounty!.id },
      { name: "Søndre Land", municipalityNumber: "3447", countyId: innlandetCounty!.id },
      { name: "Nordre Land", municipalityNumber: "3448", countyId: innlandetCounty!.id },
      { name: "Sør-Aurdal", municipalityNumber: "3449", countyId: innlandetCounty!.id },
      { name: "Etnedal", municipalityNumber: "3450", countyId: innlandetCounty!.id },
      { name: "Nord-Aurdal", municipalityNumber: "3451", countyId: innlandetCounty!.id },
      { name: "Vestre Slidre", municipalityNumber: "3452", countyId: innlandetCounty!.id },
      { name: "Øystre Slidre", municipalityNumber: "3453", countyId: innlandetCounty!.id },
      { name: "Vang", municipalityNumber: "3454", countyId: innlandetCounty!.id },

      // Vestfold (39) - Updated 2024 numbers
      { name: "Horten", municipalityNumber: "3901", countyId: vestfoldCounty!.id },
      { name: "Holmestrand", municipalityNumber: "3903", countyId: vestfoldCounty!.id },
      { name: "Tønsberg", municipalityNumber: "3905", countyId: vestfoldCounty!.id },
      { name: "Sandefjord", municipalityNumber: "3907", countyId: vestfoldCounty!.id },
      { name: "Larvik", municipalityNumber: "3909", countyId: vestfoldCounty!.id },
      { name: "Færder", municipalityNumber: "3911", countyId: vestfoldCounty!.id },

      // Telemark (40)
      { name: "Porsgrunn", municipalityNumber: "4001", countyId: telemarkCounty!.id },
      { name: "Skien", municipalityNumber: "4003", countyId: telemarkCounty!.id },
      { name: "Notodden", municipalityNumber: "4005", countyId: telemarkCounty!.id },
      { name: "Siljan", municipalityNumber: "4010", countyId: telemarkCounty!.id },
      { name: "Bamble", municipalityNumber: "4012", countyId: telemarkCounty!.id },
      { name: "Kragerø", municipalityNumber: "4014", countyId: telemarkCounty!.id },
      { name: "Drangedal", municipalityNumber: "4016", countyId: telemarkCounty!.id },
      { name: "Nome", municipalityNumber: "4018", countyId: telemarkCounty!.id },
      { name: "Midt-Telemark", municipalityNumber: "4020", countyId: telemarkCounty!.id },
      { name: "Seljord", municipalityNumber: "4022", countyId: telemarkCounty!.id },
      { name: "Hjartdal", municipalityNumber: "4024", countyId: telemarkCounty!.id },
      { name: "Tinn", municipalityNumber: "4026", countyId: telemarkCounty!.id },
      { name: "Kviteseid", municipalityNumber: "4028", countyId: telemarkCounty!.id },
      { name: "Nissedal", municipalityNumber: "4030", countyId: telemarkCounty!.id },
      { name: "Fyresdal", municipalityNumber: "4032", countyId: telemarkCounty!.id },
      { name: "Tokke", municipalityNumber: "4034", countyId: telemarkCounty!.id },
      { name: "Vinje", municipalityNumber: "4036", countyId: telemarkCounty!.id },

      // Agder (42)
      { name: "Risør", municipalityNumber: "4201", countyId: agderCounty!.id },
      { name: "Grimstad", municipalityNumber: "4202", countyId: agderCounty!.id },
      { name: "Arendal", municipalityNumber: "4203", countyId: agderCounty!.id },
      { name: "Kristiansand", municipalityNumber: "4204", countyId: agderCounty!.id },
      { name: "Lindesnes", municipalityNumber: "4205", countyId: agderCounty!.id },
      { name: "Farsund", municipalityNumber: "4206", countyId: agderCounty!.id },
      { name: "Flekkefjord", municipalityNumber: "4207", countyId: agderCounty!.id },
      { name: "Gjerstad", municipalityNumber: "4211", countyId: agderCounty!.id },
      { name: "Vegårshei", municipalityNumber: "4212", countyId: agderCounty!.id },
      { name: "Tvedestrand", municipalityNumber: "4213", countyId: agderCounty!.id },
      { name: "Froland", municipalityNumber: "4214", countyId: agderCounty!.id },
      { name: "Lillesand", municipalityNumber: "4215", countyId: agderCounty!.id },
      { name: "Birkenes", municipalityNumber: "4216", countyId: agderCounty!.id },
      { name: "Åmli", municipalityNumber: "4217", countyId: agderCounty!.id },
      { name: "Iveland", municipalityNumber: "4218", countyId: agderCounty!.id },
      { name: "Evje og Hornnes", municipalityNumber: "4219", countyId: agderCounty!.id },
      { name: "Bygland", municipalityNumber: "4220", countyId: agderCounty!.id },
      { name: "Valle", municipalityNumber: "4221", countyId: agderCounty!.id },
      { name: "Bykle", municipalityNumber: "4222", countyId: agderCounty!.id },
      { name: "Vennesla", municipalityNumber: "4223", countyId: agderCounty!.id },
      { name: "Åseral", municipalityNumber: "4224", countyId: agderCounty!.id },
      { name: "Lyngdal", municipalityNumber: "4225", countyId: agderCounty!.id },
      { name: "Hægebostad", municipalityNumber: "4226", countyId: agderCounty!.id },
      { name: "Kvinesdal", municipalityNumber: "4227", countyId: agderCounty!.id },
      { name: "Sirdal", municipalityNumber: "4228", countyId: agderCounty!.id },

      // Vestland (46)
      { name: "Bergen", municipalityNumber: "4601", countyId: vestlandCounty!.id },
      { name: "Kinn", municipalityNumber: "4602", countyId: vestlandCounty!.id },
      { name: "Etne", municipalityNumber: "4611", countyId: vestlandCounty!.id },
      { name: "Sveio", municipalityNumber: "4612", countyId: vestlandCounty!.id },
      { name: "Bømlo", municipalityNumber: "4613", countyId: vestlandCounty!.id },
      { name: "Stord", municipalityNumber: "4614", countyId: vestlandCounty!.id },
      { name: "Fitjar", municipalityNumber: "4615", countyId: vestlandCounty!.id },
      { name: "Tysnes", municipalityNumber: "4616", countyId: vestlandCounty!.id },
      { name: "Kvinnherad", municipalityNumber: "4617", countyId: vestlandCounty!.id },
      { name: "Ullensvang", municipalityNumber: "4618", countyId: vestlandCounty!.id },
      { name: "Eidfjord", municipalityNumber: "4619", countyId: vestlandCounty!.id },
      { name: "Ulvik", municipalityNumber: "4620", countyId: vestlandCounty!.id },
      { name: "Voss", municipalityNumber: "4621", countyId: vestlandCounty!.id },
      { name: "Kvam", municipalityNumber: "4622", countyId: vestlandCounty!.id },
      { name: "Samnanger", municipalityNumber: "4623", countyId: vestlandCounty!.id },
      { name: "Bjørnafjorden", municipalityNumber: "4624", countyId: vestlandCounty!.id },
      { name: "Austevoll", municipalityNumber: "4625", countyId: vestlandCounty!.id },
      { name: "Øygarden", municipalityNumber: "4626", countyId: vestlandCounty!.id },
      { name: "Askøy", municipalityNumber: "4627", countyId: vestlandCounty!.id },
      { name: "Vaksdal", municipalityNumber: "4628", countyId: vestlandCounty!.id },
      { name: "Modalen", municipalityNumber: "4629", countyId: vestlandCounty!.id },
      { name: "Osterøy", municipalityNumber: "4630", countyId: vestlandCounty!.id },
      { name: "Alver", municipalityNumber: "4631", countyId: vestlandCounty!.id },
      { name: "Austrheim", municipalityNumber: "4632", countyId: vestlandCounty!.id },
      { name: "Fedje", municipalityNumber: "4633", countyId: vestlandCounty!.id },
      { name: "Masfjorden", municipalityNumber: "4634", countyId: vestlandCounty!.id },
      { name: "Gulen", municipalityNumber: "4635", countyId: vestlandCounty!.id },
      { name: "Solund", municipalityNumber: "4636", countyId: vestlandCounty!.id },
      { name: "Hyllestad", municipalityNumber: "4637", countyId: vestlandCounty!.id },
      { name: "Høyanger", municipalityNumber: "4638", countyId: vestlandCounty!.id },
      { name: "Vik", municipalityNumber: "4639", countyId: vestlandCounty!.id },
      { name: "Sogndal", municipalityNumber: "4640", countyId: vestlandCounty!.id },
      { name: "Aurland", municipalityNumber: "4641", countyId: vestlandCounty!.id },
      { name: "Lærdal", municipalityNumber: "4642", countyId: vestlandCounty!.id },
      { name: "Årdal", municipalityNumber: "4643", countyId: vestlandCounty!.id },
      { name: "Luster", municipalityNumber: "4644", countyId: vestlandCounty!.id },
      { name: "Askvoll", municipalityNumber: "4645", countyId: vestlandCounty!.id },
      { name: "Fjaler", municipalityNumber: "4646", countyId: vestlandCounty!.id },
      { name: "Sunnfjord", municipalityNumber: "4647", countyId: vestlandCounty!.id },
      { name: "Bremanger", municipalityNumber: "4648", countyId: vestlandCounty!.id },
      { name: "Stad", municipalityNumber: "4649", countyId: vestlandCounty!.id },
      { name: "Gloppen", municipalityNumber: "4650", countyId: vestlandCounty!.id },
      { name: "Stryn", municipalityNumber: "4651", countyId: vestlandCounty!.id },

      // Trøndelag (50)
      { name: "Trondheim", municipalityNumber: "5001", countyId: trondelagCounty!.id },
      { name: "Steinkjer", municipalityNumber: "5006", countyId: trondelagCounty!.id },
      { name: "Namsos", municipalityNumber: "5007", countyId: trondelagCounty!.id },
      { name: "Frøya", municipalityNumber: "5014", countyId: trondelagCounty!.id },
      { name: "Osen", municipalityNumber: "5020", countyId: trondelagCounty!.id },
      { name: "Oppdal", municipalityNumber: "5021", countyId: trondelagCounty!.id },
      { name: "Rennebu", municipalityNumber: "5022", countyId: trondelagCounty!.id },
      { name: "Røros", municipalityNumber: "5025", countyId: trondelagCounty!.id },
      { name: "Holtålen", municipalityNumber: "5026", countyId: trondelagCounty!.id },
      { name: "Midtre Gauldal", municipalityNumber: "5027", countyId: trondelagCounty!.id },
      { name: "Melhus", municipalityNumber: "5028", countyId: trondelagCounty!.id },
      { name: "Skaun", municipalityNumber: "5029", countyId: trondelagCounty!.id },
      { name: "Malvik", municipalityNumber: "5031", countyId: trondelagCounty!.id },
      { name: "Selbu", municipalityNumber: "5032", countyId: trondelagCounty!.id },
      { name: "Tydal", municipalityNumber: "5033", countyId: trondelagCounty!.id },
      { name: "Meråker", municipalityNumber: "5034", countyId: trondelagCounty!.id },
      { name: "Stjørdal", municipalityNumber: "5035", countyId: trondelagCounty!.id },
      { name: "Frosta", municipalityNumber: "5036", countyId: trondelagCounty!.id },
      { name: "Levanger", municipalityNumber: "5037", countyId: trondelagCounty!.id },
      { name: "Verdal", municipalityNumber: "5038", countyId: trondelagCounty!.id },
      { name: "Snåsa", municipalityNumber: "5041", countyId: trondelagCounty!.id },
      { name: "Lierne", municipalityNumber: "5042", countyId: trondelagCounty!.id },
      { name: "Røyrvik", municipalityNumber: "5043", countyId: trondelagCounty!.id },
      { name: "Namsskogan", municipalityNumber: "5044", countyId: trondelagCounty!.id },
      { name: "Grong", municipalityNumber: "5045", countyId: trondelagCounty!.id },
      { name: "Høylandet", municipalityNumber: "5046", countyId: trondelagCounty!.id },
      { name: "Overhalla", municipalityNumber: "5047", countyId: trondelagCounty!.id },
      { name: "Flatanger", municipalityNumber: "5049", countyId: trondelagCounty!.id },
      { name: "Leka", municipalityNumber: "5052", countyId: trondelagCounty!.id },
      { name: "Inderøy", municipalityNumber: "5053", countyId: trondelagCounty!.id },
      { name: "Indre Fosen", municipalityNumber: "5054", countyId: trondelagCounty!.id },
      { name: "Heim", municipalityNumber: "5055", countyId: trondelagCounty!.id },
      { name: "Hitra", municipalityNumber: "5056", countyId: trondelagCounty!.id },
      { name: "Ørland", municipalityNumber: "5057", countyId: trondelagCounty!.id },
      { name: "Åfjord", municipalityNumber: "5058", countyId: trondelagCounty!.id },
      { name: "Orkland", municipalityNumber: "5059", countyId: trondelagCounty!.id },
      { name: "Nærøysund", municipalityNumber: "5060", countyId: trondelagCounty!.id },
      { name: "Rindal", municipalityNumber: "5061", countyId: trondelagCounty!.id },

      // Troms (55)
      { name: "Tromsø", municipalityNumber: "5501", countyId: tromsCounty!.id },
      { name: "Harstad", municipalityNumber: "5503", countyId: tromsCounty!.id },
      { name: "Kvæfjord", municipalityNumber: "5510", countyId: tromsCounty!.id },
      { name: "Tjeldsund", municipalityNumber: "5512", countyId: tromsCounty!.id },
      { name: "Ibestad", municipalityNumber: "5514", countyId: tromsCounty!.id },
      { name: "Gratangen", municipalityNumber: "5516", countyId: tromsCounty!.id },
      { name: "Loabák - Lavangen", municipalityNumber: "5518", countyId: tromsCounty!.id },
      { name: "Bardu", municipalityNumber: "5520", countyId: tromsCounty!.id },
      { name: "Salangen", municipalityNumber: "5522", countyId: tromsCounty!.id },
      { name: "Målselv", municipalityNumber: "5524", countyId: tromsCounty!.id },
      { name: "Sørreisa", municipalityNumber: "5526", countyId: tromsCounty!.id },
      { name: "Dyrøy", municipalityNumber: "5528", countyId: tromsCounty!.id },
      { name: "Senja", municipalityNumber: "5530", countyId: tromsCounty!.id },
      { name: "Balsfjord", municipalityNumber: "5532", countyId: tromsCounty!.id },
      { name: "Karlsøy", municipalityNumber: "5534", countyId: tromsCounty!.id },
      { name: "Lyngen", municipalityNumber: "5536", countyId: tromsCounty!.id },
      { name: "Storfjord - Omasvuotna - Omasvuono", municipalityNumber: "5538", countyId: tromsCounty!.id },
      { name: "Gáivuotna - Kåfjord - Kaivuono", municipalityNumber: "5540", countyId: tromsCounty!.id },
      { name: "Skjervøy", municipalityNumber: "5542", countyId: tromsCounty!.id },
      { name: "Nordreisa", municipalityNumber: "5544", countyId: tromsCounty!.id },
      { name: "Kvænangen", municipalityNumber: "5546", countyId: tromsCounty!.id },

      // Finnmark (56)
      { name: "Alta", municipalityNumber: "5601", countyId: finnmarkCounty!.id },
      { name: "Hammerfest", municipalityNumber: "5603", countyId: finnmarkCounty!.id },
      { name: "Sør-Varanger", municipalityNumber: "5605", countyId: finnmarkCounty!.id },
      { name: "Vadsø", municipalityNumber: "5607", countyId: finnmarkCounty!.id },
      { name: "Kárásjohka - Karasjok", municipalityNumber: "5610", countyId: finnmarkCounty!.id },
      { name: "Guovdageaidnu - Kautokeino", municipalityNumber: "5612", countyId: finnmarkCounty!.id },
      { name: "Loppa", municipalityNumber: "5614", countyId: finnmarkCounty!.id },
      { name: "Hasvik", municipalityNumber: "5616", countyId: finnmarkCounty!.id },
      { name: "Måsøy", municipalityNumber: "5618", countyId: finnmarkCounty!.id },
      { name: "Nordkapp", municipalityNumber: "5620", countyId: finnmarkCounty!.id },
      { name: "Porsanger - Porsángu - Porsanki ", municipalityNumber: "5622", countyId: finnmarkCounty!.id },
      { name: "Lebesby", municipalityNumber: "5624", countyId: finnmarkCounty!.id },
      { name: "Gamvik", municipalityNumber: "5626", countyId: finnmarkCounty!.id },
      { name: "Deatnu-Tana", municipalityNumber: "5628", countyId: finnmarkCounty!.id },
      { name: "Berlevåg", municipalityNumber: "5630", countyId: finnmarkCounty!.id },
      { name: "Båtsfjord", municipalityNumber: "5632", countyId: finnmarkCounty!.id },
      { name: "Vardø", municipalityNumber: "5634", countyId: finnmarkCounty!.id },
      { name: "Unjárga-Nesseby", municipalityNumber: "5636", countyId: finnmarkCounty!.id },
    ],
    skipDuplicates: true,
  });

  // Insert stable amenities
  const stableAmenities = [
    "Innebane",
    "Utebane",
    "Beredesbane",
    "Longebane",
    "Solarium",
    "Vaskehall",
    "Beiteområde",
    "Hestetrailer parkering",
    "Bilparkering",
    "Oppredningsrom",
    "Salebod",
    "Stallkafé",
    "Sosialrom",
    "Toalett",
    "Dusj",
    "24/7 tilgang",
    "Videoovervåkning",
    "Automatkasse",
    "Førkjøring",
    "Hestepass service",
  ];

  await prisma.stable_amenities.createMany({
    data: stableAmenities.map((name) => ({ name })),
    skipDuplicates: true,
  });

  // Insert box amenities
  const boxAmenities = [
    "Stort rom",
    "Middels rom",
    "Lite rom",
    "Vindu",
    "Strøm",
    "Vann",
    "Oppvarming",
    "Gummimatter",
    "Høybed",
    "Automatisk vanningsystem",
    "Daglig stell inkludert",
    "Kraftfôr inkludert",
    "Høy inkludert",
    "Helger og ferier dekket",
    "Dyrlege service",
  ];

  await prisma.box_amenities.createMany({
    data: boxAmenities.map((name) => ({ name })),
    skipDuplicates: true,
  });

  // Insert service types
  const serviceTypes = [
    { name: "VETERINARIAN", displayName: "Veterinær" },
    { name: "FARRIER", displayName: "Hovslagere" },
    { name: "TRAINER", displayName: "Trener/Instruktør" },
    { name: "CHIROPRACTOR", displayName: "Kiropraktor" },
    { name: "SADDLEFITTER", displayName: "Sadelmager" },
    { name: "EQUESTRIAN_SHOP", displayName: "Hestebutikk" },
  ];

  await prisma.service_types.createMany({
    data: serviceTypes,
    skipDuplicates: true,
  });
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
