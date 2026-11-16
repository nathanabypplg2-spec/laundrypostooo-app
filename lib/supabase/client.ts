import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

export function createSupabaseBrowser() {
  const url = getSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = getSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase URL / publishable key belum dikonfigurasi di Vercel.');
  return createBrowserClient(
    url,
    key,
  );
}
