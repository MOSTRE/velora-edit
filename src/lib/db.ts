/** Supabase client — optional. Site works fully without credentials. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  try {
    const url = (import.meta.env.PUBLIC_SUPABASE_URL as string) || '';
    const key = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string) || '';
    if (!url || !key) return null;
    if (!cached) cached = createClient(url, key);
    return cached;
  } catch {
    return null;
  }
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  // Server-side role check via profiles table (service-role never exposed).
  const { data } = await sb.from('profiles').select('role').eq('email', email).maybeSingle();
  return (data as { role?: string } | null)?.role === 'admin';
}
