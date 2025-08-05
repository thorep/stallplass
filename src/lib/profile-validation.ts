import { z } from 'zod';

export const profileFormSchema = z.object({
  firstname: z.string()
    .min(2, 'Fornavn må være minst 2 tegn')
    .optional()
    .or(z.literal('')),
  
  middlename: z.string().optional().or(z.literal('')),
  
  lastname: z.string()
    .min(2, 'Etternavn må være minst 2 tegn')
    .optional()
    .or(z.literal('')),
  
  nickname: z.string()
    .min(2, 'Kallenavn må være minst 2 tegn')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .regex(/^[\d\s+\-()]{8,}$/, 'Ugyldig telefonnummer')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Ugyldig e-postadresse')
    .min(1, 'E-postadresse er påkrevd'),
  
  Adresse1: z.string()
    .min(3, 'Adresse må være minst 3 tegn')
    .optional()
    .or(z.literal('')),
  
  Adresse2: z.string().optional().or(z.literal('')),
  
  Postnummer: z.string()
    .regex(/^\d{4}$/, 'Postnummer må være 4 siffer')
    .optional()
    .or(z.literal('')),
  
  Poststed: z.string().optional().or(z.literal(''))
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;