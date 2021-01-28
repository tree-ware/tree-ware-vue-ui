import { Vue } from 'vue-property-decorator'

export class PinStateController {
  constructor(private readonly setter: typeof Vue.set) {}

  get pinnedCount(): number {
    return Object.values(this.nodePinStates).filter(
      nodePinState => nodePinState.isPinned
    ).length
  }

  getNodePinState(nodeId: string): NodePinState {
    const oldState = this.nodePinStates[nodeId]
    if (oldState) return oldState
    const newState = new NodePinState(false, false)
    this.setter(this.nodePinStates, nodeId, newState)
    return newState
  }

  updateIsPinned(nodeId: string, isPinned: boolean) {
    const oldState = this.nodePinStates[nodeId]
    if (oldState) {
      if (!isPinned) {
        oldState.wasPinned = oldState.wasPinned || oldState.isPinned
      }
      oldState.isPinned = isPinned
    } else {
      const newState = new NodePinState(isPinned, false)
      this.setter(this.nodePinStates, nodeId, newState)
    }
  }

  clearAllPins() {
    Object.values(this.nodePinStates).forEach(nodePinState =>
      nodePinState.clearPin()
    )
  }

  private readonly nodePinStates: { [nodeId: string]: NodePinState } = {}
}

export class NodePinState {
  constructor(public isPinned: boolean, public wasPinned: boolean) {}

  clearPin() {
    this.wasPinned = this.wasPinned || this.isPinned
    this.isPinned = false
  }
}
