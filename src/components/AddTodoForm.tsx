'use client'

import { FormEvent, useState } from 'react'
import type { CreateTodoInput, Priority } from '@/types/todo'

interface AddTodoFormProps {
  onAdd: (input: CreateTodoInput) => void
}

const priorities: { key: Priority; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Med' },
  { key: 'high', label: 'High' },
]

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    onAdd({
      title: trimmed,
      priority,
      dueDate: dueDate || undefined,
    })

    setTitle('')
    setPriority('medium')
    setDueDate('')
    setShowDetails(false)
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-ink/15 pb-4">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="font-display text-lg italic text-ink-faint">
          +
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setShowDetails(true)}
          placeholder="Add a line to today's page…"
          aria-label="New todo title"
          className="flex-1 bg-transparent font-sans text-[15px] text-ink placeholder:text-ink-faint outline-none"
        />
      </div>

      {showDetails && (
        <div className="mt-3 flex flex-wrap items-center gap-4 pl-7">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Priority">
            {priorities.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={priority === p.key}
                onClick={() => setPriority(p.key)}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                  priority === p.key
                    ? 'bg-verdigris text-paper-card'
                    : 'text-ink-faint hover:text-ink-soft'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
            due
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded bg-transparent font-mono text-[11px] text-ink-soft outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={!title.trim()}
            className="ml-auto rounded-card bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-paper-card transition-opacity disabled:opacity-30"
          >
            Add
          </button>
        </div>
      )}
    </form>
  )
}
