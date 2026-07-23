'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useTodos } from '@/hooks/useTodos'
import { AddTodoForm } from './AddTodoForm'
import { FilterBar } from './FilterBar'
import { TodoList } from './TodoList'
import type { Todo } from '@/types/todo'

interface TodoAppProps {
  initialTodos: Todo[]
}

export function TodoApp({ initialTodos }: TodoAppProps) {
  const {
    visibleTodos,
    todos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    updateTodo,
    removeTodo,
    error,
    dismissError,
    openCount,
  } = useTodos(initialTodos)

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-14 sm:px-0">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">{today}</p>
        <h1 className="mt-1 font-display text-3xl italic text-ink">Ledger</h1>
      </header>

      <div className="rounded-card bg-paper-card px-6 py-5 shadow-card">
        <AddTodoForm onAdd={addTodo} />

        <div className="mt-4 mb-2">
          <FilterBar
            filter={filter}
            onChange={setFilter}
            openCount={openCount}
            totalCount={todos.length}
          />
        </div>

        <TodoList
          todos={visibleTodos}
          emptyContext={filter}
          onToggle={toggleTodo}
          onRemove={removeTodo}
          onEdit={(id, title) => updateTodo(id, { title })}
        />
      </div>

      <p className="mt-6 text-center font-mono text-[11px] text-ink-faint">
        Changes save automatically.
      </p>

      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed inset-x-0 bottom-6 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-card bg-clay px-4 py-2.5 text-paper-card shadow-card"
          >
            <span className="text-sm">{error}</span>
            <button
              type="button"
              onClick={dismissError}
              aria-label="Dismiss error"
              className="font-mono text-xs uppercase tracking-wide opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
