import { useEffect, useState, type FormEvent, type RefObject } from 'react'
import { supabase } from './lib/supabase'
import Nickname from './Nickname'

export type Group = { id: string; name: string; invite_code: string }

export function GroupForms({ onEntered }: { onEntered: (groupId: string) => void | Promise<void> }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.rpc('create_group', { group_name: name })
    if (error) return setError(error.message)
    setName('')
    await onEntered(data as string)
  }

  async function join(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.rpc('join_group', { code })
    if (error) return setError(error.message)
    setCode('')
    await onEntered(data as string)
  }

  return (
    <div className="stack">
      <form onSubmit={create} className="row">
        <input placeholder="New group name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        <button type="submit" className="btn btn-primary">
          Create group
        </button>
      </form>
      <form onSubmit={join} className="row">
        <input placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button type="submit" className="btn btn-primary">
          Join group
        </button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}

function GroupName({ group, userId, onRenamed }: { group: Group; userId: string; onRenamed: () => void }) {
  const [isOwner, setIsOwner] = useState(false)
  const [name, setName] = useState(group.name)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('memberships')
      .select('role')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()
      .then(({ data }) => setIsOwner(data?.role === 'owner'))
  }, [group.id, userId])

  async function save(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.rpc('rename_group', { gid: group.id, new_name: name })
    if (error) return setError(error.message)
    onRenamed()
  }

  if (!isOwner) return null
  return (
    <form onSubmit={save} className="stack">
      <label className="stack">
        <span>Group name</span>
        <span className="row">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || name.trim() === group.name}>
            Rename
          </button>
        </span>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}

export default function Settings({
  dialogRef,
  email,
  userId,
  group,
  onEntered,
  onNicknameSaved,
  onRenamed,
  onLogout,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  email: string
  userId: string
  group: Group | undefined
  onEntered: (groupId: string) => void | Promise<void>
  onNicknameSaved: () => void
  onRenamed: () => void
  onLogout: () => void
}) {
  return (
    <dialog ref={dialogRef}>
      <div className="modal-head">
        <h3>Settings</h3>
        <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </div>
      <p className="muted">{email}</p>
      {group && (
        <section>
          <h4>{group.name}</h4>
          <GroupName key={`${group.id}-${group.name}`} group={group} userId={userId} onRenamed={onRenamed} />
          <Nickname key={group.id} groupId={group.id} userId={userId} onSaved={onNicknameSaved} />
        </section>
      )}
      <section>
        <h4>Groups</h4>
        <GroupForms
          onEntered={async (id) => {
            await onEntered(id)
            dialogRef.current?.close()
          }}
        />
      </section>
      <section>
        <button type="button" className="btn" onClick={onLogout}>
          Log out
        </button>
      </section>
    </dialog>
  )
}
