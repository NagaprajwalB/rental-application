'use client'

import { motion } from 'framer-motion'
import type { TodoFilter } from '@/types/todo'

interface FilterBarProps {
  filter: TodoFilter
  onChange: (filter: TodoFilter) => void
  openCount: number
  totalCount: number
}

const tabs: { key: TodoFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'completed', label: 'Done' },
]

export function FilterBar({ filter, onChange, openCount, totalCount }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div role="tablist" aria-label="Filter todos" className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = filter === tab.key
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.key)}
              className="relative px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-ink-soft"
            >
              {isActive && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full bg-verdigris-light"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <span className={`relative ${isActive ? 'text-verdigris-dark' : ''}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
      <p className="font-mono text-xs tabular text-ink-faint">
        {openCount} of {totalCount} open
      </p>
    </div>
  )
}
