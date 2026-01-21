import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/supabase-server'
import { HomeClient } from '@/components/home-client'

export default async function Home() {
  const { user, error } = await getServerSession()

  if (error || !user) {
    redirect('/login')
  }

  return <HomeClient initialUser={user} />
}
