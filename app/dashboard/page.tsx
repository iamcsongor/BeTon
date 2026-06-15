import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BetonApp from './BetonApp'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await (supabase as any).rpc('accept_all_my_invites')
  return <BetonApp />
}
