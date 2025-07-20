import { supabase } from '@/lib/supabase';

export async function checkUserIsAdmin(firebaseId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('firebase_id', firebaseId)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return user?.is_admin ?? false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(firebaseId: string): Promise<void> {
  const isAdmin = await checkUserIsAdmin(firebaseId);
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
}