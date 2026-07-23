import { beforeEach, describe, expect, it } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import { ddb } from '@/lib/dynamodb'
import { createTodo, getTodo, listTodos, TodoNotFoundError, updateTodo } from '@/lib/todos-service'

const ddbMock = mockClient(ddb)

beforeEach(() => {
  ddbMock.reset()
})

describe('todos-service', () => {
  it('creates a todo with sane defaults', async () => {
    ddbMock.onAnyCommand().resolves({})

    const todo = await createTodo({ title: 'Water the plants' })

    expect(todo.title).toBe('Water the plants')
    expect(todo.completed).toBe(false)
    expect(todo.priority).toBe('medium')
    expect(todo.id).toHaveLength(12)
  })

  it('lists todos via the gsi1 query, oldest first', async () => {
    ddbMock.onAnyCommand().resolves({
      Items: [
        { id: '1', title: 'A', completed: false, priority: 'low', createdAt: 't1', updatedAt: 't1' },
        { id: '2', title: 'B', completed: false, priority: 'low', createdAt: 't2', updatedAt: 't2' },
      ],
    })

    const todos = await listTodos()
    expect(todos.map((t) => t.id)).toEqual(['1', '2'])
  })

  it('throws TodoNotFoundError when getting a missing id', async () => {
    ddbMock.onAnyCommand().resolves({ Item: undefined })
    await expect(getTodo('missing')).rejects.toBeInstanceOf(TodoNotFoundError)
  })

  it('merges partial updates onto the existing item', async () => {
    ddbMock.onAnyCommand().resolves({
      Item: {
        id: '1',
        title: 'Old title',
        completed: false,
        priority: 'medium',
        createdAt: 't1',
        updatedAt: 't1',
      },
    })

    const updated = await updateTodo('1', { completed: true })
    expect(updated.title).toBe('Old title')
    expect(updated.completed).toBe(true)
  })
})
