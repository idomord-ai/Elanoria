import { useEffect, useState } from 'react'
import { SRD_API_BASE_URL } from './srd'

type ResourceState<T> =
  | { status: 'loading' | 'error' | 'not-found' }
  | { status: 'success'; data: T }

export function useSrdResource<T>(path: string) {
  const [request, setRequest] = useState({ path })
  const [result, setResult] = useState<{ request: typeof request; state: ResourceState<T> }>()

  if (request.path !== path) {
    setRequest({ path })
  }

  useEffect(() => {
    const controller = new AbortController()

    function finish(state: ResourceState<T>) {
      if (!controller.signal.aborted) {
        setResult({ request, state })
      }
    }

    async function load() {
      try {
        const response = await fetch(`${SRD_API_BASE_URL}${request.path}`, { signal: controller.signal })
        if (!response.ok) {
          finish({ status: response.status === 404 ? 'not-found' : 'error' })
          return
        }

        const data = (await response.json()) as T
        finish({ status: 'success', data })
      } catch {
        finish({ status: 'error' })
      }
    }

    void load()
    return () => controller.abort()
  }, [request])

  const state: ResourceState<T> =
    request.path === path && result?.request === request ? result.state : { status: 'loading' }

  return { state, retry: () => setRequest({ path }) }
}
