import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Join({ params }: { params: { token: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=' + encodeURIComponent('/join/' + params.token))
  try {
    await (supabase as any).rpc('join_contest_via_token', { p_token: params.token })
  } catch {}
  redirect('/dashboard')
}
