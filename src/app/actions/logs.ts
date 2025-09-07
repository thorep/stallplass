'use server'

import { requireAuth } from "@/lib/auth";
import {
  createCustomLog,
  getCustomLogsByCategoryId,
  CreateLogData
} from "@/services/horse-log-service";
import { revalidatePath } from "next/cache";



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
    throw new Error("Failed to create log");
  }

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

