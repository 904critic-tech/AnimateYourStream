export type BehaviorStatus = 'success' | 'failure' | 'running'

export interface BehaviorContext {
  // Extend as needed
  now: number
}

export interface BehaviorNode {
  tick(ctx: BehaviorContext): BehaviorStatus
  reset?(): void
}

export class ActionNode implements BehaviorNode {
  private fn: (ctx: BehaviorContext) => BehaviorStatus
  constructor(fn: (ctx: BehaviorContext) => BehaviorStatus) {
    this.fn = fn
  }
  tick(ctx: BehaviorContext): BehaviorStatus { return this.fn(ctx) }
}

export class SequenceNode implements BehaviorNode {
  private children: BehaviorNode[]
  private index = 0
  constructor(children: BehaviorNode[]) { this.children = children }
  reset(): void { this.index = 0; this.children.forEach(c => c.reset?.()) }
  tick(ctx: BehaviorContext): BehaviorStatus {
    while (this.index < this.children.length) {
      const status = this.children[this.index].tick(ctx)
      if (status === 'running' || status === 'failure') return status
      this.index++
    }
    return 'success'
  }
}

export class SelectorNode implements BehaviorNode {
  private children: BehaviorNode[]
  private index = 0
  constructor(children: BehaviorNode[]) { this.children = children }
  reset(): void { this.index = 0; this.children.forEach(c => c.reset?.()) }
  tick(ctx: BehaviorContext): BehaviorStatus {
    while (this.index < this.children.length) {
      const status = this.children[this.index].tick(ctx)
      if (status === 'running' || status === 'success') return status
      this.index++
    }
    return 'failure'
  }
}

export class BehaviorTree implements BehaviorNode {
  private root: BehaviorNode
  constructor(root: BehaviorNode) { this.root = root }
  reset(): void { this.root.reset?.() }
  tick(ctx: BehaviorContext): BehaviorStatus { return this.root.tick(ctx) }
}