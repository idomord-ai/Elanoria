import { useEffect, useState } from 'react'
import { fetchSpellCatalog, type RulesEdition, type SpellSummary } from './spells'

type Result = { spells: SpellSummary[]; error: string }

const emptySpells: SpellSummary[] = []

export function useSpellCatalog(edition: RulesEdition) {
  const [request, setRequest] = useState({ edition })
  const [result, setResult] = useState<{ request: typeof request; data: Result }>()
  if (request.edition !== edition) setRequest({ edition })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const spells = await fetchSpellCatalog(request.edition, controller.signal)
        if (!controller.signal.aborted) setResult({ request, data: { spells, error: '' } })
      } catch {
        if (!controller.signal.aborted) setResult({ request, data: { spells: emptySpells, error: 'Could not load the spell library.' } })
      }
    }

    void load()
    return () => controller.abort()
  }, [request])

  const data = request.edition === edition && result?.request === request ? result.data : undefined
  return {
    spells: data?.spells ?? emptySpells,
    loading: data === undefined,
    error: data?.error ?? '',
    retry: () => setRequest({ edition }),
  }
}
