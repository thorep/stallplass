import { supabase, Bruker, TablesInsert, TablesUpdate } from '@/lib/supabase';

// Use Supabase types as foundation - Norwegian names
export type OpprettBrukerData = TablesInsert<'users'>;
export type OppdaterBrukerData = TablesUpdate<'users'>;

// English aliases for backward compatibility
export type CreateUserData = OpprettBrukerData;
export type UpdateUserData = OppdaterBrukerData;

/**
 * Opprett en ny bruker i databasen
 * Create a new user in the database
 */
export async function opprettBruker(data: OpprettBrukerData): Promise<Bruker> {
  const { data: bruker, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return bruker;
}

// English alias for backward compatibility
export const createUser = opprettBruker;

/**
 * Hent bruker med Firebase ID
 * Get user by Firebase ID
 */
export async function hentBrukerMedFirebaseId(firebase_id: string): Promise<Bruker | null> {
  const { data: bruker, error } = await supabase
    .from('users')
    .select()
    .eq('firebase_id', firebase_id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return bruker || null;
}

// English alias for backward compatibility
export const getUserByFirebaseId = hentBrukerMedFirebaseId;

/**
 * Oppdater brukerprofil
 * Update user profile
 */
export async function oppdaterBruker(firebase_id: string, data: OppdaterBrukerData): Promise<Bruker> {
  const { data: bruker, error } = await supabase
    .from('users')
    .update({
      ...data,
      oppdatert_dato: new Date().toISOString()
    })
    .eq('firebase_id', firebase_id)
    .select()
    .single();

  if (error) throw error;
  return bruker;
}

// English alias for backward compatibility
export const updateUser = oppdaterBruker;

/**
 * Sikre at bruker eksisterer i databasen (opprett hvis ikke eksisterer, oppdater hvis eksisterer)
 * Ensure user exists in database (create if not exists, update if exists)
 * This should be called on login to sync Firebase user with our database
 */
export async function sikreAtBrukerEksisterer(data: OpprettBrukerData): Promise<Bruker> {
  const { data: bruker, error } = await supabase
    .from('users')
    .upsert({
      ...data,
      oppdatert_dato: new Date().toISOString()
    }, {
      onConflict: 'firebase_id'
    })
    .select()
    .single();

  if (error) throw error;
  return bruker;
}

// English alias for backward compatibility
export const ensureUserExists = sikreAtBrukerEksisterer;

/**
 * Slett bruker fra databasen
 * Delete user from database
 */
export async function slettBruker(firebase_id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('firebase_id', firebase_id);

  if (error) throw error;
}

// English alias for backward compatibility
export const deleteUser = slettBruker;