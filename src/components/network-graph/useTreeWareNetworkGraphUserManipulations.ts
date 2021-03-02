import { computed, Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkLinkUserStateMap } from './TreeWareNetworkLink'
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

  // Add links connected to remaining nodes.
  inputGraph.links.forEach(link => {
    if (
      pinnedGraph.containsNode(link.source.id) &&
      pinnedGraph.containsNode(link.target.id)
    ) {
      pinnedGraph.addLink(link)
    }
  })

  return pinnedGraph
}

function computeUnhiddenGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap
): { unhiddenGraph: TreeWareNetworkGraph; pinCount: number } {
  const unhiddenGraph = new TreeWareNetworkGraph()
  const pinCount = inputGraph.columns.reduce(
    (pinCount, inputColumn) =>
      pinCount +
      computeUnhiddenColumn(inputColumn, nodeUserStateMap, unhiddenGraph),
    0
  )
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
  inputGraph.columns.forEach(inputColumn =>
    computePinnedColumn(inputColumn, nodeUserStateMap, pinnedGraph)
  )
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

function getNodeState<K extends keyof TreeWareNetworkNodeUserState>(
  key: K,
  nodeUserState: TreeWareNetworkNodeUserState,
  node: TreeWareNetworkNode
): TreeWareNetworkNodeUserState[K] {
  return nodeUserState ? nodeUserState[key] : node[key]
}
