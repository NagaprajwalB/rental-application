export type Priority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  title: string
  notes?: string
  completed: boolean
  priority: Priority
  dueDate?: string // ISO date, optional
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

export type TodoFilter = 'all' | 'open' | 'completed'

export interface CreateTodoInput {
  title: string
  notes?: string
  priority?: Priority
  dueDate?: string
}

export interface UpdateTodoInput {
  title?: string
  notes?: string | null
  completed?: boolean
  priority?: Priority
  dueDate?: string | null
}
