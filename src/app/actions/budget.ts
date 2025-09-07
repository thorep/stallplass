'use server'

import { requireAuth } from "@/lib/auth";
import {
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  upsertOverride,
  deleteOverride
} from "@/services/budget-service";
import { CreateBudgetItemData, UpdateBudgetItemData } from "@/services/budget-service";
import { revalidatePath } from "next/cache";

export async function createBudgetItemAction(horseId: string, formData: FormData) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  // Extract form data
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  const amount = formData.get('amount') as string;
  const isRecurring = formData.get('isRecurring') === 'true';
  const startMonth = formData.get('startMonth') as string;
  const endMonth = formData.get('endMonth') as string;
  const intervalMonths = formData.get('intervalMonths') as string;
  const intervalWeeks = formData.get('intervalWeeks') as string;
  const weekday = formData.get('weekday') as string;
  const anchorDay = formData.get('anchorDay') as string;
  const emoji = formData.get('emoji') as string;
  const notes = formData.get('notes') as string;

  // Validate required fields
  if (!title || title.trim().length === 0) {
    throw new Error("Title is required");
  }
  if (!category || category.trim().length === 0) {
    throw new Error("Category is required");
  }
  if (!amount || isNaN(parseFloat(amount))) {
    throw new Error("Valid amount is required");
  }
  if (!startMonth) {
    throw new Error("Start month is required");
  }

  // Convert form data to API format
  const budgetData: CreateBudgetItemData = {
    title: title.trim(),
    category: category.trim(),
    amount: parseFloat(amount),
    isRecurring,
    startMonth,
    endMonth: endMonth || undefined,
    intervalMonths: intervalMonths ? parseInt(intervalMonths) : undefined,
    intervalWeeks: intervalWeeks ? parseInt(intervalWeeks) : undefined,
    weekday: weekday ? parseInt(weekday) : undefined,
    anchorDay: anchorDay ? parseInt(anchorDay) : undefined,
    emoji: emoji || undefined,
    notes: notes || undefined,
  };

  await createBudgetItem(horseId, user.id, budgetData);

  // Revalidate the budget page
  revalidatePath(`/mine-hester/${horseId}/budsjett`);
}

export async function updateBudgetItemAction(horseId: string, itemId: string, formData: FormData) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  // Extract form data
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  const amount = formData.get('amount') as string;
  const isRecurring = formData.get('isRecurring') === 'true';
  const startMonth = formData.get('startMonth') as string;
  const endMonth = formData.get('endMonth') as string;
  const intervalMonths = formData.get('intervalMonths') as string;
  const intervalWeeks = formData.get('intervalWeeks') as string;
  const weekday = formData.get('weekday') as string;
  const anchorDay = formData.get('anchorDay') as string;
  const emoji = formData.get('emoji') as string;
  const notes = formData.get('notes') as string;

  // Validate required fields
  if (!title || title.trim().length === 0) {
    throw new Error("Title is required");
  }
  if (!category || category.trim().length === 0) {
    throw new Error("Category is required");
  }
  if (!amount || isNaN(parseFloat(amount))) {
    throw new Error("Valid amount is required");
  }

  // Convert form data to API format
  const budgetData: UpdateBudgetItemData = {
    title: title.trim(),
    category: category.trim(),
    amount: parseFloat(amount),
    isRecurring,
    startMonth,
    endMonth: endMonth || undefined,
    intervalMonths: intervalMonths ? parseInt(intervalMonths) : undefined,
    intervalWeeks: intervalWeeks ? parseInt(intervalWeeks) : undefined,
    weekday: weekday ? parseInt(weekday) : undefined,
    anchorDay: anchorDay ? parseInt(anchorDay) : undefined,
    emoji: emoji || undefined,
    notes: notes || undefined,
  };

  const result = await updateBudgetItem(horseId, user.id, itemId, budgetData);

  if (!result) {
    throw new Error("Budget item not found or access denied");
  }

  // Revalidate the budget page
  revalidatePath(`/mine-hester/${horseId}/budsjett`);
}

export async function deleteBudgetItemAction(horseId: string, itemId: string) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  const success = await deleteBudgetItem(horseId, user.id, itemId);

  if (!success) {
    throw new Error("Budget item not found or access denied");
  }

  // Revalidate the budget page
  revalidatePath(`/mine-hester/${horseId}/budsjett`);
}

export async function upsertBudgetOverrideAction(horseId: string, budgetItemId: string, month: string, overrideAmount?: number | null, skip?: boolean, note?: string | null) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  await upsertOverride(horseId, user.id, budgetItemId, month, overrideAmount, skip, note);

  // Revalidate the budget page
  revalidatePath(`/mine-hester/${horseId}/budsjett`);
}

export async function deleteBudgetOverrideAction(horseId: string, budgetItemId: string, month: string) {
  // Authenticate the request
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    throw new Error("Unauthorized");
  }
  const user = authResult;

  const success = await deleteOverride(horseId, user.id, budgetItemId, month);

  if (!success) {
    throw new Error("Budget override not found or access denied");
  }

  // Revalidate the budget page
  revalidatePath(`/mine-hester/${horseId}/budsjett`);
}