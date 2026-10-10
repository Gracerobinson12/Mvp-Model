// app/api/admin/summary/route.ts
// Admin-only data feed. Verifies the caller's token AND that their email is in the admin
// allow-list, then uses the service role to return counts + recent rows across the app.
//
// Env:
//   SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
//   ADMIN_EMAILS  comma-separated, e.g. "gracer@gratiacore.com,bqimtalking@gmail.com"

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ADMINS = (process.env.ADMIN_EMAILS || 'gracer@gratiacore.com,bqimtalking@gmail.com')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export async function GET(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!ADMINS.includes((user.email || '').toLowerCase())) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
    const count = (q: any) => q.then((r: any) => r.count ?? 0);

    const [
      totalUsers, signups7d, solUsers, intelUsers, trialing,
      recentSignups, waitlistCount, recentWaitlist, advisoryCount, recentAdvisory, feedbackCount, recentFeedback,
    ] = await Promise.all([
      count(admin.from('profiles').select('*', { count: 'exact', head: true })),
      count(admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', since7)),
      count(admin.from('profiles').select('*', { count: 'exact', head: true }).eq('has_solutions', true)),
      count(admin.from('profiles').select('*', { count: 'exact', head: true }).eq('has_intelligence', true)),
      count(admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan_status', 'trialing')),
      admin.from('profiles').select('email,plan,plan_status,created_at').order('created_at', { ascending: false }).limit(25),
      count(admin.from('product_waitlist').select('*', { count: 'exact', head: true })),
      admin.from('product_waitlist').select('email,product,created_at').order('created_at', { ascending: false }).limit(25),
      count(admin.from('advisory_leads').select('*', { count: 'exact', head: true })),
      admin.from('advisory_leads').select('first_name,email,stage,created_at').order('created_at', { ascending: false }).limit(25),
      count(admin.from('feedback').select('*', { count: 'exact', head: true })),
      admin.from('feedback').select('email,message,created_at').order('created_at', { ascending: false }).limit(25),
    ]);

    return NextResponse.json({
      ok: true,
      stats: { totalUsers, signups7d, solUsers, intelUsers, trialing },
      recentSignups: recentSignups.data || [],
      waitlist: { count: waitlistCount, recent: recentWaitlist.data || [] },
      advisory: { count: advisoryCount, recent: recentAdvisory.data || [] },
      feedback: { count: feedbackCount, recent: recentFeedback.data || [] },
    });
  } catch (e: any) {
    console.error('admin summary error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}