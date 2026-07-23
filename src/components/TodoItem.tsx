'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Priority, Todo } from '@/types/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, title: string) => void
}

const priorityLabel: Record<Priority, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
}

const priorityColor: Record<Priority, string> = {
  low: 'text-ink-faint',
  medium: 'text-amber',
  high: 'text-clay',
}

export function TodoItem({ todo, onToggle, onRemove, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)

  function commitEdit() {
    const trimmed = draft.trim()
    setIsEditing(false)
    if (trimmed && trimmed !== todo.title) {
      onEdit(todo.id, trimmed)
    } else {
      setDraft(todo.title)
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className="group flex items-start gap-3 border-b border-paper-line py-2.5"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={todo.completed ? `Mark "${todo.title}" as open` : `Mark "${todo.title}" as done`}
        onClick={() => onToggle(todo.id)}
        className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-ink-soft/50 transition-colors hover:border-verdigris"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <motion.path
            d="M4 10.5L8 14.5L16 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-verdigris"
            initial={false}
            animate={{ pathLength: todo.completed ? 1 : 0, opacity: todo.completed ? 1 : 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') {
                setDraft(todo.title)
                setIsEditing(false)
              }
            }}
            className="w-full bg-transparent font-sans text-[15px] text-ink outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="block w-full truncate text-left font-sans text-[15px] leading-snug transition-colors"
          >
            <span className={todo.completed ? 'text-ink-faint line-through decoration-1' : 'text-ink'}>
              {todo.title}
            </span>
          </button>
        )}

        <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] tabular text-ink-faint">
          <span className={priorityColor[todo.priority]}>{priorityLabel[todo.priority]}</span>
          {todo.dueDate && (
            <>
              <span aria-hidden="true">·</span>
              <span>due {formatDate(todo.dueDate)}</span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Delete "${todo.title}"`}
        onClick={() => onRemove(todo.id)}
        className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] text-ink-faint opacity-0 transition-opacity hover:bg-clay-light hover:text-clay group-hover:opacity-100 focus-visible:opacity-100"
      >
        remove
      </button>
    </motion.li>
  )
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
