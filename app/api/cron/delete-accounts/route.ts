// app/api/cron/delete-accounts/route.ts
// Runs daily — permanently deletes accounts that hit their deletion_scheduled_at date
// Add to vercel.json: { "path": "/api/cron/delete-accounts", "schedule": "0 2 * * *" }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all accounts past their deletion date
  const { data: toDelete } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('plan_status', 'canceled')
    .lte('deletion_scheduled_at', new Date().toISOString())
    .not('deletion_scheduled_at', 'is', null)

  if (!toDelete?.length) {
    return NextResponse.json({ deleted: 0 })
  }

  let deleted = 0
  for (const user of toDelete) {
    try {
      // Delete from auth.users — CASCADE handles profiles, vault_ideas, barter_trades
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (!error) {
        deleted++
        console.log(`Deleted account: ${user.email}`)
      }
    } catch(e) {
      console.error(`Failed to delete ${user.email}:`, e)
    }
  }

  return NextResponse.json({ deleted, checked: toDelete.length })
}