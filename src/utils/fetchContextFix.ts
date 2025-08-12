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
  // Get the original fetch function
  const originalFetch = window.fetch
  
  // Create a bound version that ensures proper context
  const boundFetch = originalFetch.bind(window)
  
  // Add additional safety checks
  return function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      // Ensure we're calling fetch with the correct context
      return boundFetch(input, init)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Illegal invocation')) {
        console.warn('⚡ Agent 2: Caught Illegal invocation, retrying with direct call')
        // Fallback: call fetch directly on window
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
  const loader: T = new LoaderClass()
  
  // Store original fetch
  const originalFetch = (globalThis as any).fetch
  
  // Apply fetch fix
  ;(globalThis as any).fetch = fetchFix
  
  // Return a proxy that restores fetch when loader is done
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown
      
      if (typeof value === 'function') {
        return function(this: unknown, ...args: any[]) {
          try {
            const fn = value as unknown as (...a: any[]) => any
            const result = fn.apply(target as unknown as object, args)
            
            // If it's a promise (like load method), restore fetch when done
            if (result && typeof result.then === 'function') {
              return result.finally(() => {
                ;(globalThis as any).fetch = originalFetch
              })
            }
            
            return result
          } catch (error) {
            // Restore fetch on error
            ;(globalThis as any).fetch = originalFetch
            throw error
          }
        }
      }
      
      return value as T[keyof T]
    }
  }
  return new Proxy<T>(loader, handler)
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
    if (error instanceof TypeError && error.message.includes('Illegal invocation')) {
      console.warn('⚡ Agent 2: Blob fetch failed, trying alternative approach')
      
      // Alternative approach for blob URLs
      if (url.startsWith('blob:')) {
        // For blob URLs, try using XMLHttpRequest as fallback
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
