import { supabaseServer } from '@/lib/supabase-server';
import { RoadmapItem, RoadmapStatus, RoadmapPriority } from '@/lib/supabase';

export async function getAllRoadmapItems() {
  try {
    const { data, error } = await supabaseServer
      .from('roadmap_items')
      .select('*')
      .eq('is_public', true)
      .neq('status', 'CANCELLED')
      .order('status', { ascending: true }) // Show completed items last
      .order('priority', { ascending: false }) // High priority first
      .order('sort_order', { ascending: true })
      .order('estimated_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    // If roadmap table doesn't exist yet, return empty array
    console.warn('Roadmap table not found, returning empty array:', error);
    return [];
  }
}

export async function getRoadmapItemsByStatus(status: RoadmapStatus) {
  const { data, error } = await supabaseServer
    .from('roadmap_items')
    .select('*')
    .eq('status', status)
    .eq('is_public', true)
    .order('priority', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('estimated_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createRoadmapItem(data: {
  title: string;
  description: string;
  category: string;
  status?: RoadmapStatus;
  priority?: RoadmapPriority;
  estimated_date?: Date;
  is_public?: boolean;
  sort_order?: number;
}) {
  const { data: roadmapItem, error } = await supabaseServer
    .from('roadmap_items')
    .insert({
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      priority: data.priority,
      estimated_date: data.estimated_date?.toISOString(),
      is_public: data.is_public,
      sort_order: data.sort_order
    })
    .select()
    .single();

  if (error) throw error;
  return roadmapItem;
}

export async function updateRoadmapItem(id: string, updateData: Partial<RoadmapItem>) {
  const { data, error } = await supabaseServer
    .from('roadmap_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markRoadmapItemCompleted(id: string) {
  const { data, error } = await supabaseServer
    .from('roadmap_items')
    .update({
      status: 'COMPLETED',
      completed_date: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoadmapItem(id: string) {
  const { data, error } = await supabaseServer
    .from('roadmap_items')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRoadmapItemsByCategory(category: string) {
  const { data, error } = await supabaseServer
    .from('roadmap_items')
    .select('*')
    .eq('category', category)
    .eq('is_public', true)
    .neq('status', 'CANCELLED')
    .order('status', { ascending: true })
    .order('priority', { ascending: false })
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}