import { VueConstructor } from 'vue'

// The Vue component instance (for `expandedContent` & `collapsedContent`)
// will be passed a property named `node` of type `TreeWareNetworkNode`.
// When it wants to change any attributes in `node`, it should emit a copy
// of `node` as a custom event named `update:node`.

export interface TreeWareNetworkNodeUserState {
  isPinned: boolean
  isExpanded: boolean
  isHidden: boolean
}

export interface TreeWareNetworkNodeUserControl {
  canPin: boolean
  canExpand: boolean
  canHide: boolean
}

export interface TreeWareNetworkNodeRenderState {}

export interface TreeWareNetworkNode
  extends TreeWareNetworkNodeUserState,
    TreeWareNetworkNodeUserControl,
    TreeWareNetworkNodeRenderState {
  id: string
  parent: TreeWareNetworkNode | null
  group: TreeWareNetworkNodeGroup | null
  classes: string[]
  expandedContent: VueConstructor
  collapsedContent: VueConstructor | null
  data: any // different nodes in the same graph can have different data types
}

export interface TreeWareNetworkNodeGroup {
  name: string
  children: TreeWareNetworkNode[]
}

export type TreeWareNetworkNodeUserStateMap = {
  [nodeId: string]: TreeWareNetworkNodeUserState
}

export type TreeWareNetworkNodeComparator = (
  a: TreeWareNetworkNode,
  b: TreeWareNetworkNode
) => number

export interface TreeWareNetworkNodeUserStateCounts {
  hidden: number
  pinned: number
  collapsed: number
}
