import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { supabase } from './lib/supabase'

type Member = { user_id: string; display_name: string }
type Score = { user_id: string; score: number }

function AddRound({
  groupId,
  members,
  dialogRef,
  onSaved,
}: {
  groupId: string
  members: Member[]
  dialogRef: RefObject<HTMLDialogElement | null>
  onSaved: () => void
}) {
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    const scores = Object.entries(values)
      .filter(([, v]) => v.trim() !== '')
      .map(([user_id, v]) => ({ user_id, score: Number(v) }))
    if (scores.length === 0) return setError('Enter at least one score.')
    setSaving(true)
    setError(null)
    const { error } = await supabase.rpc('add_round', { gid: groupId, played: date, scores })
    setSaving(false)
    if (error) return setError(error.message)
    setValues({})
    dialogRef.current?.close()
    onSaved()
  }

  return (
    <dialog ref={dialogRef}>
      <form onSubmit={save} className="stack">
        <h3>Add a round</h3>
        <label className="score-row">
          Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        {members.map((m) => (
          <label key={m.user_id} className="score-row">
            {m.display_name}
            <input
              type="number"
              inputMode="numeric"
              min={18}
              max={200}
              placeholder="Score"
              value={values[m.user_id] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [m.user_id]: e.target.value }))}
            />
          </label>
        ))}
        <small className="muted">Leave blank for anyone who didn't play.</small>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Save round
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default function Leaderboard({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const load = useCallback(async () => {
    const [m, s] = await Promise.all([
      supabase.from('memberships').select('user_id, display_name').eq('group_id', groupId),
      supabase.from('round_scores').select('user_id, score').eq('group_id', groupId),
    ])
    if (m.error || s.error) return setError((m.error ?? s.error)!.message)
    setMembers(m.data)
    setScores(s.data)
  }, [groupId])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`round_scores:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'round_scores', filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, load])

  const rows = members
    .map((m) => {
      const mine = scores.filter((s) => s.user_id === m.user_id)
      const avg = mine.length ? mine.reduce((sum, s) => sum + s.score, 0) / mine.length : null
      return { ...m, rounds: mine.length, avg }
    })
    .sort((a, b) => {
      if (a.avg === null || b.avg === null) return a.avg === b.avg ? 0 : a.avg === null ? 1 : -1
      return a.avg - b.avg
    })

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Leaderboard</h3>
        <button className="btn btn-primary" onClick={() => dialogRef.current?.showModal()}>
          Add round
        </button>
      </div>
      <table className="board">
        <thead>
          <tr>
            <th align="left">#</th>
            <th align="left">Player</th>
            <th align="right">Avg</th>
            <th align="right">Rounds</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.user_id}>
              <td>{r.avg === null ? '-' : i + 1}</td>
              <td>{r.display_name}</td>
              <td align="right">{r.avg === null ? '-' : r.avg.toFixed(1)}</td>
              <td align="right">{r.rounds}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="error" role="alert">{error}</p>}
      <AddRound groupId={groupId} members={members} dialogRef={dialogRef} onSaved={load} />
    </div>
  )
}
