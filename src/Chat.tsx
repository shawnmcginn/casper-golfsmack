import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'

type Message = { id: string; user_id: string; author_name: string; body: string; created_at: string }

const columns = 'id, user_id, author_name, body, created_at'

export default function Chat({ groupId, userId }: { groupId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

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
    bottomRef.current?.scrollIntoView()
  }, [messages])

  async function send(e: FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setError(null)
    const { data, error } = await supabase
      .from('messages')
      .insert({ group_id: groupId, body: text })
      .select(columns)
      .single()
    if (error) return setError(error.message)
    setBody('')
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data as Message]))
  }

  return (
    <div>
      <div style={{ height: 360, overflowY: 'auto', border: '1px solid #8884', padding: 8 }}>
        {messages.map((m) => (
          <p key={m.id} style={{ textAlign: m.user_id === userId ? 'right' : 'left' }}>
            <strong>{m.author_name}</strong> <small>{new Date(m.created_at).toLocaleTimeString()}</small>
            <br />
            {m.body}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          style={{ flex: 1 }}
          placeholder="Message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <button type="submit">Send</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
