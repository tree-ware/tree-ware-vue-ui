import { Vue } from 'vue-property-decorator'

export class HiddenStateController {
  constructor(private readonly setter: typeof Vue.set) {}

  get hiddenCount(): number {
    return Object.values(this.nodeHiddenStates).filter(isHidden => isHidden)
      .length
  }

  isHidden(nodeId: string): boolean {
    return this.nodeHiddenStates[nodeId] ?? false
  }

  updateIsHidden(nodeId: string, isHidden: boolean) {
    this.setter(this.nodeHiddenStates, nodeId, isHidden)
  }

  unhideAll() {
    this.nodeHiddenStates = {}
  }

  private nodeHiddenStates: { [nodeId: string]: boolean } = {}
}
