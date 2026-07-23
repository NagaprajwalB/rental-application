import { NextRequest, NextResponse } from 'next/server'
import { createTodo, listTodos } from '@/lib/todos-service'
import { createTodoSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const todos = await listTodos()
    return NextResponse.json({ todos })
  } catch (err) {
    logger.error('Failed to list todos', { error: String(err) })
    return NextResponse.json({ error: 'Failed to load todos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = createTodoSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const todo = await createTodo(parsed.data)
    return NextResponse.json({ todo }, { status: 201 })
  } catch (err) {
    logger.error('Failed to create todo', { error: String(err) })
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
}
