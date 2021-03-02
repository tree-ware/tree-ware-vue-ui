import { computed, Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import {
  TreeWareNetworkLink,
  TreeWareNetworkLinkUserStateMap
} from './TreeWareNetworkLink'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeUserState,
  TreeWareNetworkNodeUserStateMap
} from './TreeWareNetworkNode'
import {
  addChildToParent,
  cloneSubHierarchy,
  cloneWithoutHierarchy
} from './TreeWareNetworkNodeUtil'

export function useTreeWareNetworkGraphUserManipulations(
  inputGraph: Ref<TreeWareNetworkGraph>,
  nodeUserStateMap: Ref<TreeWareNetworkNodeUserStateMap>,
  linkUserStateMap: Ref<TreeWareNetworkLinkUserStateMap>
) {
  const userGraph = computed(() =>
    computeUserManipulatedGraph(
      inputGraph.value,
      nodeUserStateMap.value,
      linkUserStateMap.value
    )
  )
  return { userGraph }
}

function computeUserManipulatedGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  linkUserStateMap: TreeWareNetworkLinkUserStateMap
): TreeWareNetworkGraph {
  // Filter out hidden nodes, compute number of pinned nodes.
  const { unhiddenGraph, pinCount } = computeUnhiddenGraph(
    inputGraph,
    nodeUserStateMap
  )
  // Use all nodes if there are no pinned nodes, else use pinned nodes.
  const pinnedGraph =
    pinCount === 0
      ? unhiddenGraph
      : computePinnedGraph(unhiddenGraph, nodeUserStateMap)
  return pinnedGraph
}

function computeUnhiddenGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap
): { unhiddenGraph: TreeWareNetworkGraph; pinCount: number } {
  const unhiddenGraph = new TreeWareNetworkGraph()
  // Add unhidden nodes to the graph.
  const pinCount = inputGraph.columns.reduce(
    (pinCount, inputColumn) =>
      pinCount +
      computeUnhiddenColumn(inputColumn, nodeUserStateMap, unhiddenGraph),
    0
  )
  // Add links to the graph.
  inputGraph.links.forEach(link => {
    if (
      unhiddenGraph.containsNode(link.source.id) &&
      unhiddenGraph.containsNode(link.target.id)
    ) {
      unhiddenGraph.addLink(link)
    }
  })
  return { unhiddenGraph, pinCount }
}

function computeUnhiddenColumn(
  inputColumn: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  unhiddenGraph: TreeWareNetworkGraph
): number {
  const nodeUserState = nodeUserStateMap[inputColumn.id]
  const isHidden = getNodeState('isHidden', nodeUserState, inputColumn)
  if (isHidden) return 0
  const unhiddenColumn = cloneWithoutHierarchy(inputColumn)
  unhiddenColumn.isPinned = getNodeState('isPinned', nodeUserState, inputColumn)
  unhiddenColumn.isExpanded = getNodeState(
    'isExpanded',
    nodeUserState,
    inputColumn
  )
  unhiddenGraph.addColumn(unhiddenColumn)
  const grandChildrenPinCount =
    inputColumn.group?.children.reduce(
      (pinCount, inputChild) =>
        pinCount +
        computeUnhiddenChildNode(
          inputChild,
          nodeUserStateMap,
          unhiddenColumn,
          unhiddenGraph
        ),
      0
    ) ?? 0
  return (unhiddenColumn.isPinned ? 1 : 0) + grandChildrenPinCount
}

function computeUnhiddenChildNode(
  inputChild: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  unhiddenParent: TreeWareNetworkNode,
  unhiddenGraph: TreeWareNetworkGraph
): number {
  const nodeUserState = nodeUserStateMap[inputChild.id]
  const isHidden = getNodeState('isHidden', nodeUserState, inputChild)
  if (isHidden) return 0
  const unhiddenChild = cloneWithoutHierarchy(inputChild)
  unhiddenChild.isPinned = getNodeState('isPinned', nodeUserState, inputChild)
  unhiddenChild.isExpanded = getNodeState(
    'isExpanded',
    nodeUserState,
    inputChild
  )
  addChildToParent(unhiddenChild, unhiddenParent)
  unhiddenGraph.addNode(unhiddenChild)
  const grandChildrenPinCount =
    inputChild.group?.children.reduce(
      (pinCount, inputChild) =>
        pinCount +
        computeUnhiddenChildNode(
          inputChild,
          nodeUserStateMap,
          unhiddenChild,
          unhiddenGraph
        ),
      0
    ) ?? 0
  return (unhiddenChild.isPinned ? 1 : 0) + grandChildrenPinCount
}

function computePinnedGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap
): TreeWareNetworkGraph {
  const pinnedGraph = new TreeWareNetworkGraph()
  // Add pinned nodes and ancestors/descendents.
  inputGraph.columns.forEach(inputColumn =>
    computePinnedColumn(inputColumn, nodeUserStateMap, pinnedGraph)
  )
  // Add links connected to the pinned nodes.
  inputGraph.links.forEach(link => {
    if (isLinkEndPinned(link, nodeUserStateMap, pinnedGraph)) {
      pinnedGraph.addLink(link)
      // Ensure nodes (& their ancestors) on both sides of the link are in
      // the graph.
      ensureNodeAndAncestors(link.source.id, inputGraph, pinnedGraph)
      ensureNodeAndAncestors(link.target.id, inputGraph, pinnedGraph)
    }
  })
  return pinnedGraph
}

function computePinnedColumn(
  inputColumn: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  pinnedGraph: TreeWareNetworkGraph
) {
  const pinnedColumn = cloneWithoutHierarchy(inputColumn)
  inputColumn.group?.children.forEach(inputGrandChild => {
    computePinnedChildNode(
      inputGrandChild,
      nodeUserStateMap,
      pinnedColumn,
      pinnedGraph
    )
  })
  const inputColumnIsPinned =
    getNodeState('isPinned', nodeUserStateMap[inputColumn.id], inputColumn) ??
    false
  const pinnedColumnHasChildren =
    pinnedColumn.group && pinnedColumn.group.children.length > 0
  if (inputColumnIsPinned || pinnedColumnHasChildren) {
    pinnedGraph.addColumn(pinnedColumn)
  }
  if (inputColumnIsPinned) {
    // Add all immediate children if none of them are pinned.
    const hasPinnedImmediateChildren =
      inputColumn.group?.children.some(inputGrandChild =>
        getNodeState(
          'isPinned',
          nodeUserStateMap[inputGrandChild.id],
          inputGrandChild
        )
      ) ?? false
    if (!hasPinnedImmediateChildren) {
      inputColumn.group?.children.forEach(inputGrandChild => {
        if (pinnedGraph.containsNode(inputGrandChild.id)) return
        const includeGrandChild = cloneSubHierarchy(inputGrandChild)
        addChildToParent(includeGrandChild, pinnedColumn)
        pinnedGraph.addNode(includeGrandChild)
      })
    }
  }
}

function computePinnedChildNode(
  inputChild: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  pinnedParent: TreeWareNetworkNode,
  pinnedGraph: TreeWareNetworkGraph
) {
  const pinnedChild = cloneWithoutHierarchy(inputChild)
  inputChild.group?.children.forEach(inputGrandChild => {
    computePinnedChildNode(
      inputGrandChild,
      nodeUserStateMap,
      pinnedChild,
      pinnedGraph
    )
  })
  const inputChildIsPinned =
    getNodeState('isPinned', nodeUserStateMap[inputChild.id], inputChild) ??
    false
  const pinnedChildHasChildren =
    pinnedChild.group && pinnedChild.group.children.length > 0
  if (inputChildIsPinned || pinnedChildHasChildren) {
    addChildToParent(pinnedChild, pinnedParent)
    pinnedGraph.addNode(pinnedChild)
  }
  if (inputChildIsPinned) {
    // Add all immediate children if none of them are pinned.
    const hasPinnedImmediateChildren =
      inputChild.group?.children.some(inputGrandChild =>
        getNodeState(
          'isPinned',
          nodeUserStateMap[inputGrandChild.id],
          inputGrandChild
        )
      ) ?? false
    if (!hasPinnedImmediateChildren) {
      inputChild.group?.children.forEach(inputGrandChild => {
        if (pinnedGraph.containsNode(inputGrandChild.id)) return
        const includeGrandChild = cloneSubHierarchy(inputGrandChild)
        addChildToParent(includeGrandChild, pinnedChild)
        pinnedGraph.addNode(includeGrandChild)
      })
    }
  }
}

function isLinkEndPinned(
  link: TreeWareNetworkLink,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  pinnedGraph: TreeWareNetworkGraph
): boolean {
  const sourceNode = pinnedGraph.nodeMap[link.source.id]
  const sourceIsPinned = sourceNode
    ? getNodeState('isPinned', nodeUserStateMap[link.source.id], sourceNode)
    : false
  const targetNode = pinnedGraph.nodeMap[link.target.id]
  const targetIsPinned = targetNode
    ? getNodeState('isPinned', nodeUserStateMap[link.target.id], targetNode)
    : false
  return sourceIsPinned || targetIsPinned
}

function ensureNodeAndAncestors(
  nodeId: string,
  from: TreeWareNetworkGraph,
  to: TreeWareNetworkGraph,
  toChild?: TreeWareNetworkNode
) {
  if (to.containsNode(nodeId)) {
    if (toChild) {
      const toNode = to.nodeMap[nodeId]
      if (toNode.group) toNode.group.children.push(toChild)
    }
    return
  }
  const fromNode = from.nodeMap[nodeId]
  if (!fromNode) return
  const toNode = cloneWithoutHierarchy(fromNode)
  if (toChild && toNode.group) toNode.group.children.push(toChild)
  if (fromNode.parent) {
    to.addNode(toNode)
    ensureNodeAndAncestors(fromNode.parent.id, from, to, toNode)
  } else to.addColumn(toNode)
}

function getNodeState<K extends keyof TreeWareNetworkNodeUserState>(
  key: K,
  nodeUserState: TreeWareNetworkNodeUserState,
  node: TreeWareNetworkNode
): TreeWareNetworkNodeUserState[K] {
  return nodeUserState ? nodeUserState[key] : node[key]
}
