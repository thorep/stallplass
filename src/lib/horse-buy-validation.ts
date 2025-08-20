import { z } from "zod";

// Reuse gender enum but allow 'all' by making it optional in filters/UI
export const horseBuyGenderSchema = z.enum(["HOPPE", "HINGST", "VALLACH"]).optional();

export const createHorseBuySchema = z.object({
  name: z
    .string()
    .min(2, "Overskrift må være minst 2 tegn")
    .max(100, "Overskrift kan ikke være mer enn 100 tegn"),

  description: z
    .string()
    .min(1, "Beskrivelse må være minst 1 tegn")
    .max(2000, "Beskrivelse kan ikke være mer enn 2000 tegn"),

  // Ranges can be omitted, but when provided must be valid and consistent
  priceMin: z.number().int().min(0, "Pris må være ≥ 0").optional(),
  priceMax: z.number().int().min(0, "Pris må være ≥ 0").optional(),

  ageMin: z.number().int().min(0).max(50).optional(),
  ageMax: z.number().int().min(0).max(50).optional(),

  gender: horseBuyGenderSchema, // optional → "alle"

  heightMin: z.number().int().min(50).max(250).optional(),
  heightMax: z.number().int().min(50).max(250).optional(),

  breedId: z.string().uuid().optional(),
  disciplineId: z.string().uuid().optional(),

  contactName: z
    .string()
    .min(2, "Kontaktperson må være minst 2 tegn")
    .max(100, "Kontaktperson kan ikke være mer enn 100 tegn"),

  contactEmail: z.string().email().max(255).optional(),
  contactPhone: z.string().regex(/[\d\s+\-()]{8,}/, "Ugyldig telefonnummer").optional(),

  images: z.array(z.string().url()).max(10).optional(),
  imageDescriptions: z.array(z.string().max(255)).max(10).optional(),
})
  // Cross-field validations for ranges
  .refine(
    (data) =>
      data.priceMin === undefined ||
      data.priceMax === undefined ||
      data.priceMin <= data.priceMax,
    {
      message: "Pris fra kan ikke være større enn pris til",
      path: ["priceMin"],
    }
  )
  .refine(
    (data) => data.ageMin === undefined || data.ageMax === undefined || data.ageMin <= data.ageMax,
    { message: "Alder fra kan ikke være større enn alder til", path: ["ageMin"] }
  )
  .refine(
    (data) =>
      data.heightMin === undefined ||
      data.heightMax === undefined ||
      data.heightMin <= data.heightMax,
    { message: "Mankehøyde fra kan ikke være større enn til", path: ["heightMin"] }
  );

export const updateHorseBuySchema = createHorseBuySchema.partial().extend({
  archived: z.boolean().optional(),
});

// Search/filter schema for horse buys
export const horseBuysSearchSchema = z.object({
  // No location filters for buys
  breedId: z.string().uuid().optional(),
  disciplineId: z.string().uuid().optional(),
  gender: horseBuyGenderSchema,
  minAge: z.number().int().min(0).max(50).optional(),
  maxAge: z.number().int().min(0).max(50).optional(),
  minHeight: z.number().int().min(50).max(250).optional(),
  maxHeight: z.number().int().min(50).max(250).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  query: z.string().min(1).max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["newest", "oldest", "price_low", "price_high", "name_asc", "name_desc"]).default("newest"),
});

export type CreateHorseBuyData = z.infer<typeof createHorseBuySchema>;
export type UpdateHorseBuyData = z.infer<typeof updateHorseBuySchema>;
export type HorseBuysSearchData = z.infer<typeof horseBuysSearchSchema>;

