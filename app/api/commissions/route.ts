import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser, isSuperAdmin } from '@/lib/server-auth';
import { dummyMitra } from '@/constants/dummy';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO_MITRA_UUID: Record<string, string> = { m1: '00000000-0000-0000-0000-000000000002' };

async function resolveMitraId(supabase: ReturnType<typeof createSupabaseAdmin>, mitraId: string) {
  if (UUID_PATTERN.test(mitraId)) return mitraId;
  if (process.env.NEXT_PUBLIC_USE_DUMMY !== 'true' || !dummyMitra.some((m) => m.id === mitraId)) return null;
  const seededId = DEMO_MITRA_UUID[mitraId];
  if (!seededId) return null;
  const { data } = await supabase.from('mitra').select('id').eq('id', seededId).maybeSingle();
  return data?.id ?? null;
}

function mapCommission(row: any) {
  return {
    id: row.id,
    mitra_id: row.mitra_id,
    transaction_id: row.transaction_id,
    amount: Number(row.amount ?? 0),
    status: row.status,
    created_at: row.created_at,
    mitra_name: row.mitra?.name ?? '',
    invoice_no: row.transactions?.invoice_no ?? '',
  };
}

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const user = await getCurrentUser();
    let query = supabase
      .from('commissions')
      .select('*, mitra(name), transactions(invoice_no)')
      .order('created_at', { ascending: false });

    if (user?.role === 'mitra') {
      if (!user.mitra_id) return NextResponse.json({ data: [] });
      const mitraId = await resolveMitraId(supabase, user.mitra_id);
      if (!mitraId) return NextResponse.json({ data: [] });
      query = query.eq('mitra_id', mitraId);
    }

    if (user?.role === 'admin') {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: (data ?? []).map(mapCommission) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to load commissions' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const supabase = createSupabaseAdmin();
    const user = await getCurrentUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Hanya Super Admin yang dapat membayar komisi' }, { status: 403 });
    }

    const query = supabase.from('commissions').update({ status: body.status ?? 'paid' });
    const { data, error } = body.id
      ? await query.eq('id', body.id).select('*, mitra(name), transactions(invoice_no)')
      : await query.eq('status', 'pending').select('*, mitra(name), transactions(invoice_no)');
    if (error) throw error;
    return NextResponse.json({ data: (data ?? []).map(mapCommission) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to update commissions' }, { status: 500 });
  }
}
