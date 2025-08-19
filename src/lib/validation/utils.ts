import { z } from "zod";

// Returns the first error message from a zod schema, or undefined
export function firstError(schema: z.ZodTypeAny, value: unknown): string | undefined {
  const res = schema.safeParse(value);
  return res.success ? undefined : res.error.issues?.[0]?.message;
}

// Creates TanStack Form validators for onChange/onBlur from a zod schema
export function zodValidators(schema: z.ZodTypeAny) {
  return {
    onChange: ({ value }: { value: unknown }) => firstError(schema, value),
    onBlur: ({ value }: { value: unknown }) => firstError(schema, value),
  } as const;
}

