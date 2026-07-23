import { z } from 'zod'

export const prioritySchema = z.enum(['low', 'medium', 'high'])

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  notes: z.string().trim().max(2000, 'Notes are too long').optional(),
  priority: prioritySchema.optional().default('medium'),
  dueDate: z.string().date().optional(),
})

export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    completed: z.boolean().optional(),
    priority: prioritySchema.optional(),
    dueDate: z.string().date().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const todoIdSchema = z.string().min(1).max(64)

export type CreateTodoPayload = z.infer<typeof createTodoSchema>
export type UpdateTodoPayload = z.infer<typeof updateTodoSchema>
