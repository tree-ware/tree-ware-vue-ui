import { computed, Ref } from '@vue/composition-api'
import { getId } from '../../utilities/getId'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import {
  LINK_TYPE_GROUPED,
  TreeWareNetworkLink,
  TreeWareNetworkLinkComparator,
  TreeWareNetworkLinkUserStateMap
} from './TreeWareNetworkLink'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeComparator,
  TreeWareNetworkNodeUserState,
  TreeWareNetworkNodeUserStateMap
} from './TreeWareNetworkNode'
import {
  addChildToParent,
  cloneSubHierarchy,
  cloneWithoutHierarchy,
  defaultTreeWareNetworkLinkUserState,
  isNodeCollapsed
} from './TreeWareNetworkNodeUtil'

export function useTreeWareNetworkGraphUserManipulations(
  inputGraph: Ref<TreeWareNetworkGraph>,
  nodeUserStateMap: Ref<TreeWareNetworkNodeUserStateMap>,
  linkUserStateMap: Ref<TreeWareNetworkLinkUserStateMap>,
  compareNodes?: TreeWareNetworkNodeComparator,
  compareLinks?: TreeWareNetworkLinkComparator
) {
  const userGraph = computed(() => {
    const graph = computeUserManipulatedGraph(
      inputGraph.value,
      nodeUserStateMap.value,
      linkUserStateMap.value
    )
    if (compareNodes) graph.sortNodes(compareNodes)
    if (compareLinks) graph.sortLinks(compareLinks)
    return graph
  })
  return { userGraph }
}

interface NodeCounts {
  pinned: number
  collapsed: number
}

const ZERO_NODE_COUNTS = { pinned: 0, collapsed: 0 }

function addNodeCounts(a: NodeCounts, b: NodeCounts): NodeCounts {
  return {
    pinned: a.pinned + b.pinned,
    collapsed: a.collapsed + b.collapsed
  }
}

// TODO(deepak-nulu): split into separate computed graphs in different files.
function computeUserManipulatedGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  linkUserStateMap: TreeWareNetworkLinkUserStateMap
): TreeWareNetworkGraph {
  // Filter out hidden nodes, compute number of pinned nodes.
  const { unhiddenGraph, nodeCounts } = computeUnhiddenGraph(
    inputGraph,
    nodeUserStateMap
  )
  // Add grouped links for collapsed nodes if there are collapsed nodes.
  const groupedGraph =
    nodeCounts.collapsed === 0
      ? unhiddenGraph
      : computeGroupedGraph(unhiddenGraph)
  // Use all nodes if there are no pinned nodes, else use pinned nodes.
  const pinnedGraph =
    nodeCounts.pinned === 0
      ? groupedGraph
      : computePinnedGraph(groupedGraph, nodeUserStateMap)
  return pinnedGraph
}

function computeUnhiddenGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap
): { unhiddenGraph: TreeWareNetworkGraph; nodeCounts: NodeCounts } {
  const unhiddenGraph = new TreeWareNetworkGraph()
  // Add unhidden nodes to the graph.
  const nodeCounts = inputGraph.columns.reduce(
    (nodeCounts, inputColumn) =>
      addNodeCounts(
        nodeCounts,
        computeUnhiddenColumn(inputColumn, nodeUserStateMap, unhiddenGraph)
      ),
    ZERO_NODE_COUNTS
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
  return { unhiddenGraph, nodeCounts }
}

function computeUnhiddenColumn(
  inputColumn: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  unhiddenGraph: TreeWareNetworkGraph
): NodeCounts {
  const nodeUserState = nodeUserStateMap[inputColumn.id]
  const isHidden = getNodeState('isHidden', nodeUserState, inputColumn)
  if (isHidden) return ZERO_NODE_COUNTS
  const unhiddenColumn = cloneWithoutHierarchy(inputColumn)
  unhiddenColumn.isPinned = getNodeState('isPinned', nodeUserState, inputColumn)
  unhiddenColumn.isExpanded = getNodeState(
    'isExpanded',
    nodeUserState,
    inputColumn
  )
  unhiddenGraph.addColumn(unhiddenColumn)
  const grandChildrenCounts =
    inputColumn.group?.children.reduce(
      (nodeCounts, inputGrandChild) =>
        addNodeCounts(
          nodeCounts,
          computeUnhiddenChildNode(
            inputGrandChild,
            nodeUserStateMap,
            unhiddenColumn,
            unhiddenGraph
          )
        ),
      ZERO_NODE_COUNTS
    ) ?? ZERO_NODE_COUNTS
  const columnCounts: NodeCounts = {
    pinned: unhiddenColumn.isPinned ? 1 : 0,
    collapsed: isNodeCollapsed(unhiddenColumn) ? 1 : 0
  }
  return addNodeCounts(columnCounts, grandChildrenCounts)
}

function computeUnhiddenChildNode(
  inputChild: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  unhiddenParent: TreeWareNetworkNode,
  unhiddenGraph: TreeWareNetworkGraph
): NodeCounts {
  const nodeUserState = nodeUserStateMap[inputChild.id]
  const isHidden = getNodeState('isHidden', nodeUserState, inputChild)
  if (isHidden) return ZERO_NODE_COUNTS
  const unhiddenChild = cloneWithoutHierarchy(inputChild)
  unhiddenChild.isPinned = getNodeState('isPinned', nodeUserState, inputChild)
  unhiddenChild.isExpanded = getNodeState(
    'isExpanded',
    nodeUserState,
    inputChild
  )
  addChildToParent(unhiddenChild, unhiddenParent)
  unhiddenGraph.addNode(unhiddenChild)
  const grandChildrenCounts =
    inputChild.group?.children.reduce(
      (nodeCounts, inputGrandChild) =>
        addNodeCounts(
          nodeCounts,
          computeUnhiddenChildNode(
            inputGrandChild,
            nodeUserStateMap,
            unhiddenChild,
            unhiddenGraph
          )
        ),
      ZERO_NODE_COUNTS
    ) ?? ZERO_NODE_COUNTS
  const childCounts: NodeCounts = {
    pinned: unhiddenChild.isPinned ? 1 : 0,
    collapsed: isNodeCollapsed(unhiddenChild) ? 1 : 0
  }
  return addNodeCounts(childCounts, grandChildrenCounts)
}

type AncestorMap = { [nodeId: string]: TreeWareNetworkNode }

function computeGroupedGraph(
  inputGraph: TreeWareNetworkGraph
): TreeWareNetworkGraph {
  // Clone inputGraph
  const groupedGraph = new TreeWareNetworkGraph(inputGraph)
  // Create a map of collapsed nodes to their highest collapsed ancestors.
  // TODO(performance): compute the above map instead of collapsed count first.
  const ancestorMap = computeAncestorMapForGraph(groupedGraph)
  // Add links with ancestors.
  groupedGraph.links.forEach(link => {
    const groupLink = getGroupLinkForLink(link, groupedGraph, ancestorMap)
    if (groupLink) groupedGraph.addLink(groupLink)
  })
  return groupedGraph
}

function computeAncestorMapForGraph(graph: TreeWareNetworkGraph): AncestorMap {
  const ancestorMap = {}
  graph.columns.forEach(column => {
    computeAncestorMapForNode(column, ancestorMap)
  })
  return ancestorMap
}

function computeAncestorMapForNode(
  node: TreeWareNetworkNode,
  ancestorMap: AncestorMap
) {
  if (isNodeCollapsed(node))
    addDescendantsToAncestorMap(node, ancestorMap, node)
  else {
    node.group?.children.forEach(child =>
      computeAncestorMapForNode(child, ancestorMap)
    )
  }
}

function addDescendantsToAncestorMap(
  node: TreeWareNetworkNode,
  ancestorMap: AncestorMap,
  ancestor: TreeWareNetworkNode
) {
  node.group?.children.forEach(child => {
    ancestorMap[child.id] = ancestor
    addDescendantsToAncestorMap(child, ancestorMap, ancestor)
  })
}

function getGroupLinkForLink(
  inputLink: TreeWareNetworkLink,
  inputGraph: TreeWareNetworkGraph,
  ancestorMap: AncestorMap
): TreeWareNetworkLink | undefined {
  const source = inputGraph.nodeMap[inputLink.source.id]
  const target = inputGraph.nodeMap[inputLink.target.id]
  if (!source || !target) return undefined
  const sourceAncestor = ancestorMap[inputLink.source.id]
  const targetAncestor = ancestorMap[inputLink.target.id]
  if (sourceAncestor && targetAncestor) {
    return getGroupLinkForNodes(sourceAncestor, targetAncestor)
  } else if (sourceAncestor) {
    return getGroupLinkForNodes(sourceAncestor, target)
  } else if (targetAncestor) {
    return getGroupLinkForNodes(source, targetAncestor)
  } else return undefined
}

function getGroupLinkForNodes(
  source: TreeWareNetworkNode,
  target: TreeWareNetworkNode
): TreeWareNetworkLink {
  return {
    id: getId(source.id, target.id),
    source,
    target,
    linkType: LINK_TYPE_GROUPED,
    classes: [],
    data: null,
    ...defaultTreeWareNetworkLinkUserState,
    canSelect: false
  }
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
