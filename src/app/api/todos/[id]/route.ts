import { NextRequest, NextResponse } from 'next/server'
import { deleteTodo, TodoNotFoundError, updateTodo } from '@/lib/todos-service'
import { todoIdSchema, updateTodoSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'

interface Params {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const idResult = todoIdSchema.safeParse(params.id)
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateTodoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const todo = await updateTodo(idResult.data, parsed.data)
    return NextResponse.json({ todo })
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (err instanceof TodoNotFoundError || name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }
    logger.error('Failed to update todo', { error: String(err), id: params.id })
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const idResult = todoIdSchema.safeParse(params.id)
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    await deleteTodo(idResult.data)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    // A ConditionalCheckFailedException from the DeleteCommand means it never existed.
    const name = (err as { name?: string })?.name
    if (name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }
    logger.error('Failed to delete todo', { error: String(err), id: params.id })
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
