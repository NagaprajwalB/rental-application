'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import type { CreateTodoInput, Todo, TodoFilter, UpdateTodoInput } from '@/types/todo'

interface UseTodosResult {
  todos: Todo[]
  visibleTodos: Todo[]
  filter: TodoFilter
  setFilter: (filter: TodoFilter) => void
  isLoading: boolean
  error: string | null
  dismissError: () => void
  addTodo: (input: CreateTodoInput) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<void>
  removeTodo: (id: string) => Promise<void>
  openCount: number
}

// Temporary ids for optimistic inserts before the server assigns a real one.
function tempId() {
  return `temp-${Math.random().toString(36).slice(2)}`
}

export function useTodos(initialTodos: Todo[] = []): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [filter, setFilter] = useState<TodoFilter>('all')
  const [isLoading, setIsLoading] = useState(initialTodos.length === 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Server already gave us the list for the first paint; just revalidate quietly.
    api
      .list()
      .then((data) => {
        if (!cancelled) setTodos(data)
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addTodo = useCallback(async (input: CreateTodoInput) => {
    const now = new Date().toISOString()
    const optimistic: Todo = {
      id: tempId(),
      title: input.title,
      notes: input.notes,
      completed: false,
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
    }
    setTodos((prev) => [...prev, optimistic])

    try {
      const created = await api.create(input)
      setTodos((prev) => prev.map((t) => (t.id === optimistic.id ? created : t)))
    } catch (err) {
      setTodos((prev) => prev.filter((t) => t.id !== optimistic.id))
      setError(describeError(err))
    }
  }, [])

  const applyUpdate = useCallback(async (id: string, input: UpdateTodoInput) => {
    let previous: Todo | undefined
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        previous = t
        return {
          ...t,
          ...input,
          notes: input.notes === null ? undefined : (input.notes ?? t.notes),
          dueDate: input.dueDate === null ? undefined : (input.dueDate ?? t.dueDate),
        }
      })
    )

    try {
      const updated = await api.update(id, input)
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      if (previous) {
        const restored = previous
        setTodos((prev) => prev.map((t) => (t.id === id ? restored : t)))
      }
      setError(describeError(err))
    }
  }, [])

  const toggleTodo = useCallback(
    async (id: string) => {
      const current = todos.find((t) => t.id === id)
      if (!current) return
      await applyUpdate(id, { completed: !current.completed })
    },
    [todos, applyUpdate]
  )

  const removeTodo = useCallback(async (id: string) => {
    let removed: Todo | undefined
    let index = -1
    setTodos((prev) => {
      index = prev.findIndex((t) => t.id === id)
      removed = prev[index]
      return prev.filter((t) => t.id !== id)
    })

    try {
      await api.remove(id)
    } catch (err) {
      if (removed) {
        const toRestore = removed
        const at = index
        setTodos((prev) => {
          const next = [...prev]
          next.splice(Math.min(at, next.length), 0, toRestore)
          return next
        })
      }
      setError(describeError(err))
    }
  }, [])

  const visibleTodos = useMemo(() => {
    switch (filter) {
      case 'open':
        return todos.filter((t) => !t.completed)
      case 'completed':
        return todos.filter((t) => t.completed)
      default:
        return todos
    }
  }, [todos, filter])

  const openCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos])

  return {
    todos,
    visibleTodos,
    filter,
    setFilter,
    isLoading,
    error,
    dismissError: () => setError(null),
    addTodo,
    toggleTodo,
    updateTodo: applyUpdate,
    removeTodo,
    openCount,
  }
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Something went wrong. Please try again.'
}
