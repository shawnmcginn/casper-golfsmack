import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Chat from './Chat'
import FlagIcon from './FlagIcon'
import Leaderboard from './Leaderboard'
import Settings, { GroupForms, type Group } from './Settings'

export default function Groups({
  userId,
  email,
  onLogout,
}: {
  userId: string
  email: string
  onLogout: () => void
}) {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<Group[]>([])
  const [loaded, setLoaded] = useState(false)
  const [boardKey, setBoardKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const settingsRef = useRef<HTMLDialogElement>(null)

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

  async function entered(id: string) {
    await load()
    navigate(`/g/${id}`)
  }

  function inviteLink(group: Group) {
    const site = new URL(import.meta.env.BASE_URL, window.location.origin).href
    const subject = `Join ${group.name} on Golfsmack`
    const body = [
      `You're invited to join "${group.name}" on Golfsmack, a group chat and leaderboard for our golf group.`,
      '',
      `1. Open ${site}`,
      '2. Sign up or log in',
      '3. Tap your avatar (top right), then Settings, then Join group',
      `4. Enter this invite code: ${group.invite_code}`,
    ].join('\n')
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (!loaded) return null
  const current = groups.find((g) => g.id === groupId)

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <FlagIcon />
          Golfsmack
        </div>
        {groups.length > 0 && (
          <label className="topbar-field">
            Group
            <select
              className="group-select"
              value={groupId ?? ''}
              onChange={(e) => navigate(`/g/${e.target.value}`)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {current && (
          <a className="invite-btn" href={inviteLink(current)} target="_blank" rel="noopener noreferrer">
            Invite a friend
          </a>
        )}
        <button className="avatar" aria-label="Settings" onClick={() => settingsRef.current?.showModal()}>
          {(email[0] ?? '?').toUpperCase()}
        </button>
      </header>

      <main className="page">
        {error && <p className="error" role="alert">{error}</p>}
        {groups.length === 0 && (
          <div className="panel empty">
            <p>You're not in any groups yet. Create one to get started.</p>
            <GroupForms onEntered={entered} />
          </div>
        )}
        {current && (
          <div className="layout">
            <div className="main-col">
              <Chat key={current.id} groupId={current.id} userId={userId} refreshKey={boardKey} />
            </div>
            <aside className="side-col">
              <Leaderboard key={`${current.id}-${boardKey}`} groupId={current.id} />
            </aside>
          </div>
        )}
      </main>

      <Settings
        dialogRef={settingsRef}
        email={email}
        userId={userId}
        group={current}
        onEntered={entered}
        onNicknameSaved={() => setBoardKey((k) => k + 1)}
        onLogout={onLogout}
      />
    </>
  )
}
