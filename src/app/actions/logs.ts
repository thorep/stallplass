'use server'

import { requireAuth } from "@/lib/auth";
import {
  createCustomLog,
  getCustomLogsByCategoryId,
  CreateLogData
} from "@/services/horse-log-service";
import { revalidatePath } from "next/cache";
import { getPostHogServer } from "@/lib/posthog-server";



export async function createCustomLogAction(horseId: string, categoryId: string, formData: FormData) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  const description = formData.get('description') as string;
  const images = formData.getAll('images') as string[];
  const imageDescriptions = formData.getAll('imageDescriptions') as string[];

  const data: CreateLogData = {
    description,
    images: images.length > 0 ? images : undefined,
    imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined,
  };

  const log = await createCustomLog(categoryId, user.id, data);

  if (!log) {
    throw new Error("Kunne ikke opprette logg. Sjekk at du har tilgang til denne kategorien og at hesten ikke er arkivert.");
  }

  // Track log creation in PostHog (server-side)
  try {
    const ph = getPostHogServer();
    // posthog-node capture
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ph as any).capture?.({
      distinctId: user.id,
      event: 'horse_log_added',
      properties: {
        horse_id: horseId,
        category_id: categoryId,
        images_count: data.images?.length || 0,
        has_images: Boolean(data.images?.length),
        timestamp: new Date().toISOString(),
      },
    });
  } catch {}

  revalidatePath(`/mine-hester/${horseId}/logg`);
  return log;
}

export async function getCustomLogsByCategoryIdAction(categoryId: string) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  const logs = await getCustomLogsByCategoryId(categoryId, user.id);

  if (logs === null) {
    throw new Error("Uautorisert eller kategori finnes ikke");
  }

  return logs;
}
