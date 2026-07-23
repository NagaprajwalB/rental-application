type Level = 'info' | 'warn' | 'error'

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...meta,
  })
  // eslint-disable-next-line no-console
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
}
