// Browser-compatible EventEmitter implementation
// Replaces Node.js EventEmitter for browser compatibility

export class BrowserEventEmitter {
  private events: Map<string, ((...args: unknown[]) => void)[]> = new Map()

  // Add event listener
  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
    return this
  }

  // Add one-time event listener
  once(event: string, listener: (...args: unknown[]) => void): this {
    const onceWrapper = (...args: unknown[]) => {
      this.off(event, onceWrapper)
      listener(...args)
    }
    return this.on(event, onceWrapper)
  }

  // Remove event listener
  off(event: string, listener: (...args: unknown[]) => void): this {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
      if (listeners.length === 0) {
        this.events.delete(event)
      }
    }
    return this
  }

  // Remove all listeners for an event
  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
    return this
  }

  // Emit event
  emit(event: string, ...args: unknown[]): boolean {
    const listeners = this.events.get(event)
    if (listeners && listeners.length > 0) {
      try {
        listeners.forEach(listener => {
          listener(...args)
        })
        return true
      } catch (error) {
        console.error(`EventEmitter error in event '${event}':`, error)
        return false
      }
    }
    return false
  }

  // Get listener count
  listenerCount(event: string): number {
    const listeners = this.events.get(event)
    return listeners ? listeners.length : 0
  }

  // Get all listeners for an event
  listeners(event: string): ((...args: unknown[]) => void)[] {
    return this.events.get(event)?.slice() || []
  }
}
