interface EmptyStateProps {
  context: 'all' | 'open' | 'completed'
}

const copy: Record<EmptyStateProps['context'], { title: string; body: string }> = {
  all: {
    title: 'The page is blank.',
    body: 'Write your first line above to start today\u2019s ledger.',
  },
  open: {
    title: 'Nothing open.',
    body: 'Every line on today\u2019s page is settled.',
  },
  completed: {
    title: 'Nothing settled yet.',
    body: 'Lines you check off will collect here.',
  },
}

export function EmptyState({ context }: EmptyStateProps) {
  const { title, body } = copy[context]
  return (
    <div className="flex flex-col items-center gap-1 py-14 text-center">
      <p className="font-display text-lg italic text-ink-soft">{title}</p>
      <p className="text-sm text-ink-faint">{body}</p>
    </div>
  )
}
