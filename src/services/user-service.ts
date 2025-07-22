import { supabase, TablesInsert, TablesUpdate } from '@/lib/supabase';
import { Tables } from '@/types/supabase';

// Use Supabase types as foundation
export type CreateUserData = TablesInsert<'users'>;
export type UpdateUserData = TablesUpdate<'users'>;

/**
 * Create a new user in the database
 */
export async function createUser(data: CreateUserData): Promise<Tables<'users'>> {
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<Tables<'users'> | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return user || null;
}

/**
 * Update user profile
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<Tables<'users'>> {
  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Ensure user exists in database (create if not exists, update if exists)
 * This should be called on login to sync user with our database
 */
export async function ensureUserExists(data: CreateUserData): Promise<Tables<'users'>> {
  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      ...data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Delete user from database
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw error;
}