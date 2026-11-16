import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

export function createSupabaseBrowser() {
  // Direct process.env references are required for Next.js to inline public env
  // values into the browser bundle at build time.
  const url = getSupabaseEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
  const key = getSupabaseEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase URL / publishable key belum dikonfigurasi di Vercel.');
  return createBrowserClient(
    url,
    key,
  );
}
