import { supabase, User, TablesInsert, TablesUpdate } from '@/lib/supabase';

// Use Supabase types as foundation
export type CreateUserData = TablesInsert<'users'>;
export type UpdateUserData = TablesUpdate<'users'>;

/**
 * Create a new user in the database
 */
export async function createUser(data: CreateUserData): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Get user by Firebase ID
 */
export async function getUserByFirebaseId(firebase_id: string): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('firebase_id', firebase_id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return user || null;
}

/**
 * Update user profile
 */
export async function updateUser(firebase_id: string, data: UpdateUserData): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('firebase_id', firebase_id)
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Ensure user exists in database (create if not exists, update if exists)
 * This should be called on login to sync Firebase user with our database
 */
export async function ensureUserExists(data: CreateUserData): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      ...data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'firebase_id'
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Delete user from database
 */
export async function deleteUser(firebase_id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('firebase_id', firebase_id);

  if (error) throw error;
}