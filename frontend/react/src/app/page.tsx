import { redirect } from 'next/navigation'

/**
 * Root page — redirects to dashboard if session exists (middleware will
 * allow the request) or to login if not.
 */
export default function HomePage() {
  redirect('/dashboard')
}
