'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { Todo } from '@/types/todo'
import { TodoItem } from './TodoItem'
import { EmptyState } from './EmptyState'

interface TodoListProps {
  todos: Todo[]
  emptyContext: 'all' | 'open' | 'completed'
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, title: string) => void
}

export function TodoList({ todos, emptyContext, onToggle, onRemove, onEdit }: TodoListProps) {
  if (todos.length === 0) {
    return <EmptyState context={emptyContext} />
  }

  return (
    <motion.ul layout className="flex flex-col">
      <AnimatePresence initial={false}>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onRemove={onRemove} onEdit={onEdit} />
        ))}
      </AnimatePresence>
    </motion.ul>
  )
}
