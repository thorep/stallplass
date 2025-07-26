import type { roadmap_items, RoadmapPriority, RoadmapStatus } from "@/generated/prisma";
import { supabaseServer } from "@/lib/supabase-server";

export async function getAllRoadmapItems() {
  try {
    const { data, error } = await supabaseServer
      .from("roadmap_items")
      .select("*")
      .eq("isPublic", true)
      .neq("status", "CANCELLED")
      .order("status", { ascending: true }) // Show completed items last
      .order("priority", { ascending: false }) // High priority first
      .order("sortOrder", { ascending: true })
      .order("estimatedDate", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    // If roadmap table doesn't exist yet, return empty array
    console.warn("Roadmap table not found, returning empty array:", error);
    return [];
  }
}

export async function getRoadmapItemsByStatus(status: RoadmapStatus) {
  const { data, error } = await supabaseServer
    .from("roadmap_items")
    .select("*")
    .eq("status", status)
    .eq("isPublic", true)
    .order("priority", { ascending: false })
    .order("sortOrder", { ascending: true })
    .order("estimatedDate", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createRoadmapItem(data: {
  title: string;
  description: string;
  category: string;
  status?: RoadmapStatus;
  priority?: RoadmapPriority;
  estimatedDate?: Date;
  isPublic?: boolean;
  sortOrder?: number;
}) {
  const { data: roadmapItem, error } = await supabaseServer
    .from("roadmap_items")
    .insert({
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      priority: data.priority,
      estimatedDate: data.estimatedDate?.toISOString(),
      isPublic: data.isPublic,
      sortOrder: data.sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return roadmapItem;
}

export async function updateRoadmapItem(id: string, updateData: Partial<roadmap_items>) {
  const { data, error } = await supabaseServer
    .from("roadmap_items")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markRoadmapItemCompleted(id: string) {
  const { data, error } = await supabaseServer
    .from("roadmap_items")
    .update({
      status: "COMPLETED",
      completedDate: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoadmapItem(id: string) {
  const { data, error } = await supabaseServer
    .from("roadmap_items")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
//Test
export async function getRoadmapItemsByCategory(category: string) {
  const { data, error } = await supabaseServer
    .from("roadmap_items")
    .select("*")
    .eq("category", category)
    .eq("isPublic", true)
    .neq("status", "CANCELLED")
    .order("status", { ascending: true })
    .order("priority", { ascending: false })
    .order("sortOrder", { ascending: true });

  if (error) throw error;
  return data || [];
}
