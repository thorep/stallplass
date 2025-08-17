import { z } from 'zod';

// Enum schemas matching the database enums
export const horseGenderSchema = z.enum(['HOPPE', 'HINGST', 'VALLACH'], {
  message: 'Ugyldig kjønn'
});

export const horseSizeSchema = z.enum([
  'KATEGORI_4',
  'KATEGORI_3', 
  'KATEGORI_2',
  'KATEGORI_1',
  'UNDER_160',
  'SIZE_160_170',
  'OVER_170'
], {
  message: 'Ugyldig størrelse'
});

// Horse sales creation schema
export const createHorseSaleSchema = z.object({
  name: z.string()
    .min(2, 'Navn må være minst 2 tegn')
    .max(100, 'Navn kan ikke være mer enn 100 tegn'),
  
  description: z.string()
    .min(10, 'Beskrivelse må være minst 10 tegn')
    .max(2000, 'Beskrivelse kan ikke være mer enn 2000 tegn'),
  
  price: z.number()
    .int('Pris må være et heltall')
    .positive('Pris må være positiv')
    .max(10000000, 'Pris kan ikke være mer enn 10,000,000 NOK'),
  
  age: z.number()
    .int('Alder må være et heltall')
    .min(0, 'Alder må være minst 0 år')
    .max(50, 'Alder kan ikke være mer enn 50 år'),
  
  gender: horseGenderSchema,
  
  breedId: z.string()
    .uuid('Ugyldig rase ID'),
  
  disciplineId: z.string()
    .uuid('Ugyldig disiplin ID'),
  
  size: horseSizeSchema,
  
  height: z.number()
    .int('Høyde må være et heltall')
    .min(50, 'Høyde må være minst 50 cm')
    .max(250, 'Høyde kan ikke være mer enn 250 cm')
    .optional(),
  
  address: z.string()
    .min(3, 'Adresse må være minst 3 tegn')
    .max(255, 'Adresse kan ikke være mer enn 255 tegn')
    .optional(),
  
  postalCode: z.string()
    .regex(/^\d{4}$/, 'Postnummer må være 4 siffer')
    .optional(),
  
  postalPlace: z.string()
    .min(2, 'Poststed må være minst 2 tegn')
    .max(100, 'Poststed kan ikke være mer enn 100 tegn')
    .optional(),
  
  latitude: z.number()
    .min(-90, 'Ugyldig breddegrad')
    .max(90, 'Ugyldig breddegrad')
    .optional(),
  
  longitude: z.number()
    .min(-180, 'Ugyldig lengdegrad')
    .max(180, 'Ugyldig lengdegrad')
    .optional(),
  
  countyId: z.string()
    .uuid('Ugyldig fylke ID')
    .optional(),
  
  municipalityId: z.string()
    .uuid('Ugyldig kommune ID')
    .optional(),
  
  kommuneNumber: z.string()
    .optional(),
  
  contactName: z.string()
    .min(2, 'Kontaktnavn må være minst 2 tegn')
    .max(100, 'Kontaktnavn kan ikke være mer enn 100 tegn'),
  
  contactEmail: z.string()
    .email('Ugyldig e-postadresse')
    .max(255, 'E-postadresse kan ikke være mer enn 255 tegn'),
  
  contactPhone: z.string()
    .regex(/^[\d\s+\-()]{8,}$/, 'Ugyldig telefonnummer')
    .optional(),
  
  images: z.array(z.string().url('Ugyldig bilde URL'))
    .max(10, 'Maksimalt 10 bilder')
    .optional(),
  
  imageDescriptions: z.array(z.string().max(255, 'Bildebeskrivelse kan ikke være mer enn 255 tegn'))
    .max(10, 'Maksimalt 10 bildebeskrivelser')
    .optional()
});

// Horse sales update schema (all fields optional except validation)
export const updateHorseSaleSchema = createHorseSaleSchema.partial().extend({
  archived: z.boolean().optional()
});

// Search/filter schema for horse sales
export const horseSalesSearchSchema = z.object({
  breedId: z.string().uuid().optional(),
  disciplineId: z.string().uuid().optional(),
  gender: horseGenderSchema.optional(),
  horseSalesSize: horseSizeSchema.optional(),
  minAge: z.number().int().min(0).max(50).optional(),
  maxAge: z.number().int().min(0).max(50).optional(),
  minPrice: z.number().int().positive().optional(),
  maxPrice: z.number().int().positive().optional(),
  fylkeId: z.string().uuid().optional(),
  kommuneId: z.string().uuid().optional(),
  query: z.string().min(1).max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum([
    'newest', 
    'oldest', 
    'price_low', 
    'price_high', 
    'name_asc', 
    'name_desc'
  ]).default('newest')
});

export type CreateHorseSaleData = z.infer<typeof createHorseSaleSchema>;
export type UpdateHorseSaleData = z.infer<typeof updateHorseSaleSchema>;
export type HorseSalesSearchData = z.infer<typeof horseSalesSearchSchema>;