import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from './lib/supabase'

type Message = {
  id: string
  user_id: string
  author_name: string
  body: string
  image_path: string | null
  created_at: string
}

const columns = 'id, user_id, author_name, body, image_path, created_at'

function Photo({ path, onLoad }: { path: string; onLoad: () => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase.storage
      .from('chat-photos')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (active && data) setUrl(data.signedUrl)
      })
    return () => {
      active = false
    }
  }, [path])

  if (!url) return null
  return <img src={url} alt="" onLoad={onLoad} />
}

export default function Chat({
  groupId,
  userId,
  refreshKey,
}: {
  groupId: string
  userId: string
  refreshKey: number
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    // realtime and the send handler can both deliver the same row
    const add = (m: Message) =>
      setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]))

    supabase
      .from('messages')
      .select(columns)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError(error.message)
        else setMessages((prev) => [...(data as Message[]).reverse(), ...prev.filter((p) => !data.some((d) => d.id === p.id))])
      })

    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => add(payload.new as Message),
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    // current nicknames win over the name stamped on each message when it was sent
    supabase
      .from('memberships')
      .select('user_id, display_name')
      .eq('group_id', groupId)
      .then(({ data }) => {
        if (data) setNames(Object.fromEntries(data.map((m) => [m.user_id, m.display_name])))
      })
  }, [groupId, refreshKey])

  const scrollToBottom = () => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function post(text: string, imagePath: string | null) {
    setError(null)
    const { data, error } = await supabase
      .from('messages')
      .insert({ group_id: groupId, body: text, image_path: imagePath })
      .select(columns)
      .single()
    if (error) return setError(error.message)
    setBody('')
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data as Message]))
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    await post(text, null)
  }

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    const path = `${groupId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`
    const { error } = await supabase.storage.from('chat-photos').upload(path, file, { contentType: file.type })
    if (error) setError(error.message)
    else await post(body.trim(), path)
    setUploading(false)
  }

  return (
    <div>
      <div className="chat-log" ref={logRef}>
        {[...messages]
          .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
          .map((m) => (
          <div key={m.id} className={m.user_id === userId ? 'msg mine' : 'msg'}>
            <div className="msg-meta">
              <strong>{names[m.user_id] ?? m.author_name}</strong>{' '}
              {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
            {m.body && <div>{m.body}</div>}
            {m.image_path && <Photo path={m.image_path} onLoad={scrollToBottom} />}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="composer">
        <input
          type="text"
          placeholder="Message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} hidden />
        <button type="button" className="btn" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? 'Uploading...' : 'Photo'}
        </button>
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
