import { useCallback, useEffect, useRef, useState } from 'react'
import { getEntryState, recordVisit } from '../../domain/index'
import type { EntryState } from '../../domain/index'

/**
 * How the planner opens (PRD 15, 25). Checked when the app loads and again whenever the tab or installed app comes
 * back into view, so a planner left open for days still gets Welcome Back. A normal open counts as a visit.
 */
export function useEntry() {
  const [state, setState] = useState<EntryState | 'loading'>('loading')
  const current = useRef<EntryState | 'loading'>('loading')

  useEffect(() => {
    current.current = state
  }, [state])

  useEffect(() => {
    let alive = true
    const check = () =>
      getEntryState()
        .then(async (next) => {
          if (next === 'none') await recordVisit()
          if (alive) setState(next)
        })
        .catch(() => alive && setState('none'))
    void check()
    const onVisible = () => {
      // Never interrupt a first launch or Welcome Back that is already showing.
      if (document.visibilityState === 'visible' && current.current === 'none') void check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const finish = useCallback(async () => {
    await recordVisit()
    setState('none')
  }, [])

  return { state, finish }
}
