import { redirect } from 'next/navigation'

// The middleware sends unauthenticated users to /login.
export default function Home() {
  redirect('/dashboard')
}
