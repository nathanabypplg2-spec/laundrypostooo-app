import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = session.user as any;
    // Demo accounts use local ids (u1/u2/u3), not auth.users UUIDs.
    if (!UUID_PATTERN.test(String(sessionUser.id ?? ''))) {
      return NextResponse.json({
        data: {
          id: sessionUser.id,
          email: sessionUser.email ?? '',
          full_name: sessionUser.name ?? '',
          name: sessionUser.name ?? '',
          phone: sessionUser.phone ?? '',
          role: sessionUser.role ?? 'super_admin',
          outlet_id: sessionUser.outlet_id ?? null,
          mitra_id: sessionUser.mitra_id ?? null,
        },
      });
    }

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from('profiles')
      .select('id, email, full_name, phone, role, outlet_id, mitra_id, created_at')
      .eq('id', (session.user as any).id)
      .single();

    if (error) throw error;

    const profileData = {
      ...data,
      name: data.full_name,
      phone: (data as any).phone || '',
    };

    return NextResponse.json({ data: profileData });
  } catch (error) {
    console.error('[PROFILE_GET_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = session.user as any;
    if (!UUID_PATTERN.test(String(sessionUser.id ?? ''))) {
      return NextResponse.json(
        { error: 'Profil akun demo hanya bisa dilihat; perubahan profil perlu akun Supabase.' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const admin = createSupabaseAdmin();

    const updateData: any = {
      full_name: body.name,
    };

    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }

    const { error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', sessionUser.id);

    if (error) throw error;

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('[PROFILE_PATCH_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
