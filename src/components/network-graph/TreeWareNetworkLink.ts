import { TreeWareNetworkNode } from './TreeWareNetworkNode'

export const LINK_TYPE_GROUPED = 'grouped'

export interface TreeWareNetworkLinkUserState {
  isSelected: boolean
}

export interface TreeWareNetworkLinkUserControl {
  canSelect: boolean
}

export interface TreeWareNetworkLinkRenderState {}

export interface TreeWareNetworkLink
  extends TreeWareNetworkLinkUserState,
    TreeWareNetworkLinkUserControl,
    TreeWareNetworkLinkRenderState {
  id: string
  source: TreeWareNetworkNode
  target: TreeWareNetworkNode
  /** Used as the arrowhead marker ID and as the class for the arrow lines. */
  linkType: string
  classes: string[]
  data: any // different links in the same graph can have different data types
}

export type TreeWareNetworkLinkUserStateMap = {
  [linkId: string]: TreeWareNetworkLinkUserState
}

export type TreeWareNetworkLinkComparator = (
  a: TreeWareNetworkLink,
  b: TreeWareNetworkLink
) => number

export interface TreeWareNetworkLinkUserStateCounts {
  selected: number
  total: number
}
