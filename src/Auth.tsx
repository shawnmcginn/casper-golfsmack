import { useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import FlagIcon from './FlagIcon'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else if (!data.session) setNotice('Check your email to confirm your account, then log in.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="auth">
      <div className="brand">
        <FlagIcon />
        Golfsmack
      </div>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {mode === 'login' ? 'Log in' : 'Sign up'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p>{notice}</p>}
      <button type="button" className="btn btn-ghost" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
    </form>
  )
}
