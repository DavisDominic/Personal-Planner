import { liveQuery } from 'dexie'

/**
 * Runs a domain query and re-runs it whenever the data it read changes, so screens update the
 * moment something is saved, without the UI touching the database. Returns an unsubscribe function.
 */
export function watch<T>(query: () => Promise<T>, onNext: (value: T) => void, onError?: (error: unknown) => void): () => void {
  const subscription = liveQuery(query).subscribe({ next: onNext, error: onError })
  return () => subscription.unsubscribe()
}
