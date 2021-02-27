import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeUserControl,
  TreeWareNetworkNodeUserState
} from './TreeWareNetworkNode'

export const defaultTreeWareNetworkNodeUserState: TreeWareNetworkNodeUserState = {
  isPinned: false,
  isExpanded: false,
  isHidden: false
}

export const treeWareNetworkNodeUserControlNone: TreeWareNetworkNodeUserControl = {
  canPin: false,
  canExpand: false,
  canHide: false
}

export const treeWareNetworkNodeUserControlAll: TreeWareNetworkNodeUserControl = {
  canPin: true,
  canExpand: true,
  canHide: true
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
