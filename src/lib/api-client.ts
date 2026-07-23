import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.error ?? `Request failed with ${res.status}`, res.status)
  }
  return data as T
}

export const api = {
  async list(): Promise<Todo[]> {
    const res = await fetch('/api/todos', { cache: 'no-store' })
    const data = await handle<{ todos: Todo[] }>(res)
    return data.todos
  },

  async create(input: CreateTodoInput): Promise<Todo> {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await handle<{ todo: Todo }>(res)
    return data.todo
  },

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await handle<{ todo: Todo }>(res)
    return data.todo
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    await handle<void>(res)
  },
}
