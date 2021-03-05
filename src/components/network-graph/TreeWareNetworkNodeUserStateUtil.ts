import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeUserState,
  TreeWareNetworkNodeUserStateCounts
} from './TreeWareNetworkNode'

export const ZERO_NODE_COUNTS: TreeWareNetworkNodeUserStateCounts = {
  hidden: 0,
  pinned: 0,
  collapsed: 0
}

export function addNodeCounts(
  a: TreeWareNetworkNodeUserStateCounts,
  b: TreeWareNetworkNodeUserStateCounts
): TreeWareNetworkNodeUserStateCounts {
  return {
    hidden: a.hidden + b.hidden,
    pinned: a.pinned + b.pinned,
    collapsed: a.collapsed + b.collapsed
  }
}

export function getNodeState<K extends keyof TreeWareNetworkNodeUserState>(
  key: K,
  nodeUserState: TreeWareNetworkNodeUserState,
  node: TreeWareNetworkNode
): TreeWareNetworkNodeUserState[K] {
  return nodeUserState ? nodeUserState[key] : node[key]
}
