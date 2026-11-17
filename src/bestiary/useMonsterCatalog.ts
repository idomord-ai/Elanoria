import { useEffect, useState } from 'react'
import { fetchMonsterCatalog, type MonsterCatalogEntry } from './monsterCatalog'

type MonsterCatalogState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: MonsterCatalogEntry[] }

export function useMonsterCatalog() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ attempt: number; state: MonsterCatalogState }>()

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const data = await fetchMonsterCatalog(controller.signal)
        if (!controller.signal.aborted) setResult({ attempt, state: { status: 'success', data } })
      } catch {
        if (!controller.signal.aborted) setResult({ attempt, state: { status: 'error' } })
      }
    }

    void load()
    return () => controller.abort()
  }, [attempt])

  const state: MonsterCatalogState = result?.attempt === attempt ? result.state : { status: 'loading' }
  return { state, retry: () => setAttempt((previous) => previous + 1) }
}
