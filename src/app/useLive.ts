import { useEffect, useState } from 'react'
import { watch } from '../domain/index'

/**
 * Reads data through a domain query and keeps it current: when anything the query read is saved,
 * the screen updates by itself. `key` identifies what is being shown (e.g. the date); while it
 * changes, `data` is undefined rather than showing the previous screen's data.
 */
export function useLive<T>(query: () => Promise<T>, key: string): T | undefined {
  const [state, setState] = useState<{ key: string; value: T }>()

  useEffect(() => watch(query, (value) => setState({ key, value }), console.error), [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return state?.key === key ? state.value : undefined
}
