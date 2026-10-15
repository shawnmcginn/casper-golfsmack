import { useState, type FormEvent, type RefObject } from 'react'
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

export default function Settings({
  dialogRef,
  email,
  userId,
  group,
  onEntered,
  onNicknameSaved,
  onLogout,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
  email: string
  userId: string
  group: Group | undefined
  onEntered: (groupId: string) => void | Promise<void>
  onNicknameSaved: () => void
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
