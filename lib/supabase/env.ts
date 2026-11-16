/**
 * Read a single Supabase environment value safely.
 * This also recovers when multiple KEY=value lines were pasted into one Vercel
 * value field, which otherwise gets sent verbatim as an invalid HTTP header.
 */
export function getSupabaseEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;

  let value = raw.trim().replace(/^(["'])(.*)\1$/s, '$2').trim();
  if (value.startsWith(`${name}=`)) value = value.slice(name.length + 1).trim();

  // Keep the requested value and discard any subsequent pasted env assignments.
  const nextAssignment = value.search(/(?:NEXTAUTH_SECRET|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)\s*=/i);
  if (nextAssignment >= 0) value = value.slice(0, nextAssignment).trim();

  return value || undefined;
}
