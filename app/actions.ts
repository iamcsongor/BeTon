'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// --- Profile setup ---------------------------------------------------------
export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const display_name = String(formData.get('display_name') ?? '').trim()
  const handle =
    String(formData.get('handle') ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '') || null

  if (!display_name) redirect('/profile?error=' + encodeURIComponent('Name is required'))

  const { error } = await supabase
    .from('profiles')
    .update({ display_name, handle })
    .eq('id', user.id)
  if (error) redirect('/profile?error=' + encodeURIComponent(error.message))

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// --- Create a contest and challenge an opponent ----------------------------
export async function createContestAndChallenge(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') ?? '').trim() || 'BeTon contest'
  const opponentEmail = String(formData.get('opponent_email') ?? '').trim().toLowerCase()
  const startDate = String(formData.get('start_date') ?? '')
  const numWeeks = Math.max(1, Math.min(52, Number(formData.get('num_weeks') ?? 15)))

  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(start.getTime() + (numWeeks * 7 - 1) * 86400000)
  const endDate = end.toISOString().slice(0, 10)

  const { data: contest, error } = await supabase
    .from('contests')
    .insert({
      name,
      created_by: user.id,
      start_date: startDate,
      end_date: endDate,
      num_weeks: numWeeks,
      status: 'active',
      checkin_weeks: [5, 10, 15],
    })
    .select('id')
    .single()

  if (error || !contest) {
    redirect('/new?error=' + encodeURIComponent(error?.message ?? 'Could not create contest'))
  }

  // Creator takes the blue corner
  await supabase.from('contest_participants').insert({
    contest_id: contest.id,
    profile_id: user.id,
    color: 'blue',
    status: 'active',
  })

  // Challenge the opponent (red corner) by email
  if (opponentEmail && opponentEmail !== user.email?.toLowerCase()) {
    await supabase.from('contest_invites').insert({
      contest_id: contest.id,
      email: opponentEmail,
      color: 'red',
      invited_by: user.id,
    })
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// --- Respond to a challenge -------------------------------------------------
export async function acceptInvite(formData: FormData) {
  const supabase = await createClient()
  const inviteId = String(formData.get('invite_id') ?? '')
  if (inviteId) await supabase.rpc('accept_invite', { p_invite_id: inviteId })
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function declineInvite(formData: FormData) {
  const supabase = await createClient()
  const inviteId = String(formData.get('invite_id') ?? '')
  if (inviteId) await supabase.rpc('decline_invite', { p_invite_id: inviteId })
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
