import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeUserControl,
  TreeWareNetworkNodeUserState
} from './TreeWareNetworkNode'

export const defaultTreeWareNetworkNodeUserState: TreeWareNetworkNodeUserState = {
  isPinned: false,
  isHidden: false,
  isExpanded: false
}

export const treeWareNetworkNodeUserControlNone: TreeWareNetworkNodeUserControl = {
  canPin: false,
  canHide: false,
  canExpand: false
}

export const treeWareNetworkNodeUserControlAll: TreeWareNetworkNodeUserControl = {
  canPin: true,
  canHide: true,
  canExpand: true
}

export function addChildToParent(
  child: TreeWareNetworkNode,
  parent: TreeWareNetworkNode
) {
  child.parent = parent
  parent.group?.children.push(child)
}

export function sortChildrenById(parent: TreeWareNetworkNode) {
  parent.group?.children.sort((a, b) => a.id.localeCompare(b.id))
}
