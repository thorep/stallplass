import { supabase, User } from '@/lib/supabase';

export interface CreateUserData {
  firebaseId: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

/**
 * Create a new user in the database
 */
export async function createUser(data: CreateUserData): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      firebase_id: data.firebaseId,
      email: data.email,
      name: data.name,
      phone: data.phone
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}

/**
 * Get user by Firebase ID
 */
export async function getUserByFirebaseId(firebaseId: string): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('firebase_id', firebaseId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return user || null;
}

/**
 * Update user profile
 */
export async function updateUser(firebaseId: string, data: UpdateUserData): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('firebase_id', firebaseId)
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
      firebase_id: data.firebaseId,
      email: data.email,
      name: data.name,
      phone: data.phone,
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
export async function deleteUser(firebaseId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('firebase_id', firebaseId);

  if (error) throw error;
}