import { VueConstructor } from 'vue'
import { TreeWareImageData } from '../image/TreeWareImageInterfaces'

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
  canZoom: boolean
}

export interface TreeWareNetworkNodeRenderState {}

// Different nodes in the same graph can have different data types, so this
// base data interface has a `type` discriminator to allow clients of the data
// to determine the type.
export interface TreeWareNetworkNodeData {
  type: string
}

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
  data: TreeWareNetworkNodeData | null
}

export interface TreeWareNetworkNodeGroup {
  name: string
  image?: TreeWareImageData
  childrenName?: string
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
