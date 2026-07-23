import { customAlphabet } from 'nanoid'
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE_NAME } from './dynamodb'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

// URL-safe, collision-resistant, sortable-enough id. 12 chars keeps DynamoDB items small.
const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)

// The app is single-tenant today (personal use). Keeping a userId in the key design
// costs nothing now and means adding real multi-user auth later is a data-model
// no-op — only the value passed in here changes.
const DEFAULT_USER_ID = 'default'

function pk(userId: string) {
  return `USER#${userId}`
}
function sk(id: string) {
  return `TODO#${id}`
}
function gsi1pk(userId: string) {
  return `USER#${userId}`
}
function gsi1sk(createdAt: string, id: string) {
  return `${createdAt}#${id}`
}

interface TodoItem extends Todo {
  pk: string
  sk: string
  gsi1pk: string
  gsi1sk: string
}

function toTodo(item: TodoItem): Todo {
  const { pk: _pk, sk: _sk, gsi1pk: _g1pk, gsi1sk: _g1sk, ...todo } = item
  return todo
}

export class TodoNotFoundError extends Error {
  constructor(id: string) {
    super(`Todo "${id}" was not found`)
    this.name = 'TodoNotFoundError'
  }
}

export async function listTodos(userId: string = DEFAULT_USER_ID): Promise<Todo[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'gsi1',
      KeyConditionExpression: 'gsi1pk = :pk',
      ExpressionAttributeValues: { ':pk': gsi1pk(userId) },
      ScanIndexForward: true, // oldest first
    })
  )
  return (result.Items ?? []).map((item) => toTodo(item as TodoItem))
}

export async function getTodo(id: string, userId: string = DEFAULT_USER_ID): Promise<Todo> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: pk(userId), sk: sk(id) },
    })
  )
  if (!result.Item) throw new TodoNotFoundError(id)
  return toTodo(result.Item as TodoItem)
}

export async function createTodo(
  input: CreateTodoInput,
  userId: string = DEFAULT_USER_ID
): Promise<Todo> {
  const now = new Date().toISOString()
  const id = generateId()

  const todo: Todo = {
    id,
    title: input.title,
    notes: input.notes,
    completed: false,
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate,
    createdAt: now,
    updatedAt: now,
  }

  const item: TodoItem = {
    ...todo,
    pk: pk(userId),
    sk: sk(id),
    gsi1pk: gsi1pk(userId),
    gsi1sk: gsi1sk(now, id),
  }

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      // Belt-and-braces: ids are generated server-side, but this guarantees we never
      // silently overwrite an existing item if a ~36^12 collision ever happened.
      ConditionExpression: 'attribute_not_exists(pk)',
    })
  )

  return todo
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput,
  userId: string = DEFAULT_USER_ID
): Promise<Todo> {
  const existing = await getTodo(id, userId) // 404s early if missing

  const updated: Todo = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.notes !== undefined ? { notes: input.notes ?? undefined } : {}),
    ...(input.completed !== undefined ? { completed: input.completed } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate ?? undefined } : {}),
    updatedAt: new Date().toISOString(),
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: pk(userId), sk: sk(id) },
      UpdateExpression:
        'SET title = :title, notes = :notes, completed = :completed, priority = :priority, ' +
        'dueDate = :dueDate, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':title': updated.title,
        ':notes': updated.notes ?? null,
        ':completed': updated.completed,
        ':priority': updated.priority,
        ':dueDate': updated.dueDate ?? null,
        ':updatedAt': updated.updatedAt,
      },
      ConditionExpression: 'attribute_exists(pk)',
    })
  )

  return updated
}

export async function deleteTodo(id: string, userId: string = DEFAULT_USER_ID): Promise<void> {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: pk(userId), sk: sk(id) },
      ConditionExpression: 'attribute_exists(pk)',
    })
  )
}
