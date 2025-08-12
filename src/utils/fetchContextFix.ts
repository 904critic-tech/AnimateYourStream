/**
 * Fetch Context Fix Utility
 * 
 * Agent 2 - Performance Optimization Team
 * Provides robust solutions for "Illegal invocation" errors in fetch calls
 * during model loading operations.
 */

/**
 * Creates a properly bound fetch function to avoid "Illegal invocation" errors
 */
export function createBoundFetch(): typeof fetch {
  const originalFetch = window.fetch
  const boundFetch = originalFetch.bind(window)
  return function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      return boundFetch(input, init)
    } catch (error) {
      if (error instanceof TypeError && (error as Error).message.includes('Illegal invocation')) {
        console.warn('⚡ Agent 2: Caught Illegal invocation, retrying with direct call')
        return window.fetch(input, init)
      }
      throw error
    }
  }
}

/**
 * Wraps a loader with fetch context protection
 */
export function wrapLoaderWithFetchFix<T extends object>(
  LoaderClass: new () => T,
  fetchFix: typeof fetch = createBoundFetch()
): T {
  const loader = new LoaderClass()
  const originalFetch = (globalThis as any).fetch
  ;(globalThis as any).fetch = fetchFix

  return new Proxy(loader as any, {
    get(target, prop) {
      const value = (target as any)[prop]
      if (typeof value === 'function') {
        return function(...args: any[]) {
          try {
            const result = value.apply(target, args)
            if (result && typeof result.then === 'function') {
              return result.finally(() => {
                ;(globalThis as any).fetch = originalFetch
              })
            }
            return result
          } catch (error) {
            ;(globalThis as any).fetch = originalFetch
            throw error
          }
        }
      }
      return value
    }
  }) as T
}

/**
 * Creates a safe loader factory that handles fetch context issues
 */
export function createSafeLoader<T extends object>(
  LoaderClass: new () => T
): () => T {
  return () => wrapLoaderWithFetchFix(LoaderClass)
}

/**
 * Utility to run a function with fetch context protection
 */
export async function withFetchContextFix<T>(
  fn: () => Promise<T>
): Promise<T> {
  const originalFetch = (globalThis as any).fetch
  const safeFetch = createBoundFetch()
  
  try {
    ;(globalThis as any).fetch = safeFetch
    return await fn()
  } finally {
    ;(globalThis as any).fetch = originalFetch
  }
}

/**
 * Enhanced fetch that handles blob URLs properly
 */
export async function safeFetchBlob(url: string): Promise<Response> {
  const fetch = createBoundFetch()
  
  try {
    return await fetch(url)
  } catch (error) {
    if (error instanceof TypeError && (error as Error).message.includes('Illegal invocation')) {
      console.warn('⚡ Agent 2: Blob fetch failed, trying alternative approach')
      if (url.startsWith('blob:')) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('GET', url, true)
          xhr.responseType = 'blob'
          
          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = new Response(xhr.response, {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: new Headers({
                  'content-type': xhr.getResponseHeader('content-type') || 'application/octet-stream'
                })
              })
              resolve(response)
            } else {
              reject(new Error(`XHR failed: ${xhr.status}`))
            }
          }
          
          xhr.onerror = () => reject(new Error('XHR error'))
          xhr.send()
        })
      }
    }
    throw error
  }
}
