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

  return (
    <div style={{ maxWidth: 640, margin: '2rem auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Golfsmack</h1>
        <button onClick={() => supabase.auth.signOut()}>Log out</button>
      </header>
      <p>Signed in as {session.user.email}</p>
      <Routes>
        <Route path="/" element={<Groups userId={session.user.id} />} />
        <Route path="/g/:groupId" element={<Groups userId={session.user.id} />} />
      </Routes>
    </div>
  )
}
