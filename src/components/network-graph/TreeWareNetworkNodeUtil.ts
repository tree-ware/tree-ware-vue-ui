import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeComparator,
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
  canHide: false,
  canZoom: false
}

export const treeWareNetworkNodeUserControlAll: TreeWareNetworkNodeUserControl = {
  canPin: true,
  canExpand: true,
  canHide: true,
  canZoom: true
}

export function addChildToParent(
  child: TreeWareNetworkNode,
  parent: TreeWareNetworkNode,
  graph: TreeWareNetworkGraph
) {
  child.parent = parent
  parent.group?.children.push(child)
  graph.addNode(child)
}

export function addChildToParentIfNotEmpty(
  child: TreeWareNetworkNode,
  parent: TreeWareNetworkNode,
  graph: TreeWareNetworkGraph
) {
  if (child.group?.children.length) addChildToParent(child, parent, graph)
}

export function compareNodeIds(a: TreeWareNetworkNode, b: TreeWareNetworkNode) {
  return a.id.localeCompare(b.id)
}

export function cloneWithoutHierarchy(
  node: TreeWareNetworkNode
): TreeWareNetworkNode {
  return {
    ...node,
    parent: null,
    group: node.group ? { ...node.group, children: [] } : null
  }
}

export function cloneSuperHierarchy(
  node: TreeWareNetworkNode,
  childClone: TreeWareNetworkNode | null = null
): TreeWareNetworkNode {
  const clone = cloneWithoutHierarchy(node)
  if (childClone && clone.group) clone.group.children = [childClone]
  return node.parent ? cloneSuperHierarchy(node.parent, clone) : clone
}

export function cloneSubHierarchy(
  node: TreeWareNetworkNode,
  parentClone: TreeWareNetworkNode | null = null
): TreeWareNetworkNode {
  return {
    ...node,
    parent: parentClone,
    group: node.group
      ? {
          ...node.group,
          children: node.group.children.map(child =>
            cloneSubHierarchy(child, node)
          )
        }
      : null
  }
}

export function sortNodeChildren(
  node: TreeWareNetworkNode,
  compareNodes: TreeWareNetworkNodeComparator
) {
  node.group?.children.sort(compareNodes)
  node.group?.children.forEach(child => sortNodeChildren(child, compareNodes))
}

export function isNodeCollapsed(node: TreeWareNetworkNode): boolean {
  const hasChildren = Boolean(node.group?.children.length ?? 0)
  return hasChildren && !node.isExpanded
}

export function getHighestCollapsedAncestor(
  node: TreeWareNetworkNode,
  currentHighest?: TreeWareNetworkNode
): TreeWareNetworkNode | undefined {
  if (!node.parent) return currentHighest
  const newHighest = isNodeCollapsed(node.parent) ? node.parent : currentHighest
  return getHighestCollapsedAncestor(node.parent, newHighest)
}
