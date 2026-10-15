import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'

export default function Nickname({
  groupId,
  userId,
  onSaved,
}: {
  groupId: string
  userId: string
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [saved, setSaved] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('memberships')
      .select('display_name')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.display_name)
          setSaved(data.display_name)
        }
      })
  }, [groupId, userId])

  async function save(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.rpc('set_nickname', { gid: groupId, nickname: name })
    if (error) return setError(error.message)
    setSaved(name.trim())
    onSaved()
  }

  return (
    <form onSubmit={save} className="stack">
      <label className="stack">
        <span>Your nickname in this group</span>
        <span className="row">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required />
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || name.trim() === saved}>
            Save
          </button>
        </span>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}
