import { listTodos } from '@/lib/todos-service'
import { TodoApp } from '@/components/TodoApp'
import { logger } from '@/lib/logger'
import type { Todo } from '@/types/todo'

export const dynamic = 'force-dynamic' // always read fresh from DynamoDB, never statically cache

export default async function Page() {
  let initialTodos: Todo[] = []
  try {
    initialTodos = await listTodos()
  } catch (err) {
    // Don't fail the whole page if DynamoDB has a hiccup — the client hook will
    // retry the fetch itself and surface an error toast if that also fails.
    logger.error('Failed to load initial todos on server', { error: String(err) })
  }

  return <TodoApp initialTodos={initialTodos} />
}
