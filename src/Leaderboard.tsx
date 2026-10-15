import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { supabase } from './lib/supabase'

type Member = { user_id: string; display_name: string }
type Score = { round_id: string; user_id: string; score: number }
type Round = { id: string; played_on: string }

function formatDate(playedOn: string) {
  const [y, m, d] = playedOn.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

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

function RoundsViewer({
  dialogRef,
  rounds,
  scores,
  members,
  index,
  onIndex,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  rounds: Round[]
  scores: Score[]
  members: Member[]
  index: number
  onIndex: (i: number) => void
}) {
  const safeIndex = Math.min(index, Math.max(rounds.length - 1, 0))
  const round = rounds[safeIndex]
  const rows = round ? scores.filter((s) => s.round_id === round.id).sort((a, b) => a.score - b.score) : []
  const nameOf = (id: string) => members.find((m) => m.user_id === id)?.display_name ?? 'Former member'

  return (
    <dialog ref={dialogRef}>
      <div className="modal-head">
        <h3>Rounds</h3>
        <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </div>
      {!round ? (
        <p className="muted">No rounds yet.</p>
      ) : (
        <>
          <div className="carousel">
            <button
              type="button"
              className="btn carousel-btn"
              aria-label="Newer round"
              disabled={safeIndex === 0}
              onClick={() => onIndex(safeIndex - 1)}
            >
              ‹
            </button>
            <div className="carousel-slide">
              <h4>{formatDate(round.played_on)}</h4>
              <table className="board">
                <thead>
                  <tr>
                    <th align="left">Player</th>
                    <th align="right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id}>
                      <td>{nameOf(r.user_id)}</td>
                      <td align="right">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn carousel-btn"
              aria-label="Older round"
              disabled={safeIndex === rounds.length - 1}
              onClick={() => onIndex(safeIndex + 1)}
            >
              ›
            </button>
          </div>
          <p className="muted center">
            {safeIndex + 1} of {rounds.length}
          </p>
        </>
      )}
    </dialog>
  )
}

export default function Leaderboard({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const addRef = useRef<HTMLDialogElement>(null)
  const viewRef = useRef<HTMLDialogElement>(null)

  const load = useCallback(async () => {
    const [m, s, r] = await Promise.all([
      supabase.from('memberships').select('user_id, display_name').eq('group_id', groupId),
      supabase.from('round_scores').select('round_id, user_id, score').eq('group_id', groupId),
      supabase
        .from('rounds')
        .select('id, played_on')
        .eq('group_id', groupId)
        .order('played_on', { ascending: false })
        .order('created_at', { ascending: false }),
    ])
    const failed = m.error ?? s.error ?? r.error
    if (failed) return setError(failed.message)
    setMembers(m.data ?? [])
    setScores(s.data ?? [])
    setRounds(r.data ?? [])
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
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              setRoundIndex(0)
              viewRef.current?.showModal()
            }}
          >
            View rounds
          </button>
          <button className="btn btn-primary" onClick={() => addRef.current?.showModal()}>
            Add round
          </button>
        </div>
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
      <AddRound groupId={groupId} members={members} dialogRef={addRef} onSaved={load} />
      <RoundsViewer
        dialogRef={viewRef}
        rounds={rounds}
        scores={scores}
        members={members}
        index={roundIndex}
        onIndex={setRoundIndex}
      />
    </div>
  )
}
