// Invite-only gate: who may CREATE contests and send challenges.
// Configured via the BETON_ADMIN_EMAILS env var (comma-separated emails).
// If it's left blank, contest creation is open to any signed-in user.

export function adminEmails(): string[] {
  return (process.env.BETON_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function canCreateContests(email?: string | null): boolean {
  const list = adminEmails()
  if (list.length === 0) return true // no allowlist set → open
  return !!email && list.includes(email.toLowerCase())
}
