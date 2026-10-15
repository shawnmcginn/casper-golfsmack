import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Chat from './Chat'
import Leaderboard from './Leaderboard'
import Nickname from './Nickname'

type Group = { id: string; name: string; invite_code: string }

export default function Groups({ userId }: { userId: string }) {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [boardKey, setBoardKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('groups').select('id, name, invite_code').order('created_at')
    if (error) setError(error.message)
    else setGroups(data)
    setLoaded(true)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (loaded && !groupId && groups.length > 0) navigate(`/g/${groups[0].id}`, { replace: true })
  }, [loaded, groupId, groups, navigate])

  async function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.rpc('create_group', { group_name: name })
    if (error) return setError(error.message)
    setName('')
    await load()
    navigate(`/g/${data as string}`)
  }

  async function join(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.rpc('join_group', { code })
    if (error) return setError(error.message)
    setCode('')
    await load()
    navigate(`/g/${data as string}`)
  }

  if (!loaded) return null
  const current = groups.find((g) => g.id === groupId)

  return (
    <div>
      {groups.length > 0 && (
        <select value={groupId ?? ''} onChange={(e) => navigate(`/g/${e.target.value}`)}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}
      <form onSubmit={create} style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
        <input
          placeholder="New group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
        />
        <button type="submit">Create group</button>
      </form>
      <form onSubmit={join} style={{ display: 'inline-flex', gap: 8, marginLeft: 12 }}>
        <input
          placeholder="Invite code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit">Join group</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {groups.length === 0 && <p>You're not in any groups yet. Create one to get started.</p>}
      {current && (
        <>
          <h2>{current.name}</h2>
          <p>
            Invite code: <code>{current.invite_code}</code>
          </p>
          <Nickname
            key={current.id}
            groupId={current.id}
            userId={userId}
            onSaved={() => setBoardKey((k) => k + 1)}
          />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '2 1 320px', minWidth: 0 }}>
              <Chat key={current.id} groupId={current.id} userId={userId} />
            </div>
            <aside style={{ flex: '1 1 240px' }}>
              <Leaderboard key={`${current.id}-${boardKey}`} groupId={current.id} />
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
