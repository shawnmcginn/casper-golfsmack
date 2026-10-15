import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Auth from './Auth'
import Groups from './Groups'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) return null
  if (!session) return <Auth />

  const groups = (
    <Groups
      userId={session.user.id}
      email={session.user.email ?? ''}
      onLogout={() => supabase.auth.signOut()}
    />
  )

  return (
    <Routes>
      <Route path="/" element={groups} />
      <Route path="/g/:groupId" element={groups} />
    </Routes>
  )
}
