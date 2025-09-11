'use server'

import { requireAuth } from "@/lib/auth";
import { createHorse, updateHorse, deleteHorse } from "@/services/horse-service";
import { CreateHorseData, UpdateHorseData } from "@/types/horse";
import { HorseGender } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function createHorseAction(formData: FormData) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  // Extract form data
  const name = formData.get('name') as string;
  const breed = formData.get('breed') as string;
  const age = formData.get('age') as string;
  const color = formData.get('color') as string;
  const gender = formData.get('gender') as string;
  const height = formData.get('height') as string;
  const weight = formData.get('weight') as string;
  const images = formData.get('images') as string;
  const imageDescriptions = formData.get('imageDescriptions') as string;

  // Validate required fields
  if (!name || name.trim().length === 0) {
    throw new Error("Horse name is required");
  }

  // Parse images and descriptions
  let parsedImages: string[] = [];
  let parsedImageDescriptions: string[] = [];

  try {
    parsedImages = images ? JSON.parse(images) : [];
    parsedImageDescriptions = imageDescriptions ? JSON.parse(imageDescriptions) : [];
  } catch (error) {
    console.error("Error parsing images or descriptions:", error);
  }

  // Convert form data to API format
  const horseData: CreateHorseData = {
    name: name.trim(),
    breed: breed?.trim() || undefined,
    age: age ? parseInt(age) : undefined,
    color: color?.trim() || undefined,
    gender: gender as HorseGender || undefined,
    height: height ? parseInt(height) : undefined,
    weight: weight ? parseInt(weight) : undefined,
    images: parsedImages,
    imageDescriptions: parsedImageDescriptions,
  };

  await createHorse(user.id, horseData);

  // Track horse creation event
  // Note: PostHog tracking is handled on client side for now

  // Revalidate the horses page
  revalidatePath('/mine-hester');
}

export async function updateHorseAction(formData: FormData) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  const horseId = formData.get('horseId') as string;

  if (!horseId) {
    throw new Error("Horse ID is required");
  }

  // Extract form data
  const name = formData.get('name') as string;
  const breed = formData.get('breed') as string;
  const age = formData.get('age') as string;
  const color = formData.get('color') as string;
  const gender = formData.get('gender') as string;
  const height = formData.get('height') as string;
  const weight = formData.get('weight') as string;
  const images = formData.get('images') as string;
  const imageDescriptions = formData.get('imageDescriptions') as string;

  // Validate required fields
  if (!name || name.trim().length === 0) {
    throw new Error("Horse name cannot be empty");
  }

  // Parse images and descriptions
  let parsedImages: string[] = [];
  let parsedImageDescriptions: string[] = [];

  try {
    parsedImages = images ? JSON.parse(images) : [];
    parsedImageDescriptions = imageDescriptions ? JSON.parse(imageDescriptions) : [];
  } catch (error) {
    console.error("Error parsing images or descriptions:", error);
  }

  // Convert form data to API format
  const horseData: UpdateHorseData = {
    name: name.trim(),
    breed: breed?.trim() || undefined,
    age: age ? parseInt(age) : undefined,
    color: color?.trim() || undefined,
    gender: gender as HorseGender || undefined,
    height: height ? parseInt(height) : undefined,
    weight: weight ? parseInt(weight) : undefined,
    images: parsedImages,
    imageDescriptions: parsedImageDescriptions,
  };

  const horse = await updateHorse(horseId, user.id, horseData);

  if (!horse) {
    throw new Error("Horse not found or access denied");
  }

  // Revalidate the horses page and specific horse page
  revalidatePath('/mine-hester');
  revalidatePath(`/hest/${horseId}`);
}

// Generic update horse action for simple field updates
export async function updateHorseFieldAction(horseId: string, field: string, value: unknown) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  if (!horseId) {
    throw new Error("Horse ID is required");
  }

  // Create update data object
  const updateData: UpdateHorseData = {
    [field]: value
  };

  const horse = await updateHorse(horseId, user.id, updateData);

  if (!horse) {
    throw new Error("Horse not found or access denied");
  }

  // Revalidate the horses page and specific horse page
  revalidatePath('/mine-hester');
  revalidatePath(`/hest/${horseId}`);

  return horse;
}

export async function deleteHorseAction(horseId: string) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  if (!horseId) {
    throw new Error("Horse ID is required");
  }

  const success = await deleteHorse(horseId, user.id);

  if (!success) {
    throw new Error("Horse not found or access denied");
  }

  // Revalidate the horses page
  revalidatePath('/mine-hester');
}