import { computed, ref, Ref } from '@vue/composition-api'
import { getId } from '../../utilities/getId'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import {
  LINK_TYPE_GROUPED,
  TreeWareNetworkLink,
  TreeWareNetworkLinkComparator,
  TreeWareNetworkLinkUserStateMap
} from './TreeWareNetworkLink'
import { getLinkState } from './TreeWareNetworkLinkUserStateUtil'
import {
  cloneLink,
  defaultTreeWareNetworkLinkUserState
} from './TreeWareNetworkLinkUtil'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeComparator,
  TreeWareNetworkNodeUserStateCounts,
  TreeWareNetworkNodeUserStateMap
} from './TreeWareNetworkNode'
import {
  addNodeCounts,
  getNodeState,
  ZERO_NODE_COUNTS
} from './TreeWareNetworkNodeUserStateUtil'
import {
  addChildToParent,
  cloneSubHierarchy,
  cloneWithoutHierarchy,
  isNodeCollapsed
} from './TreeWareNetworkNodeUtil'

export function useTreeWareNetworkGraphUserManipulations(
  inputGraph: Ref<TreeWareNetworkGraph>,
  nodeUserStateMap: Ref<TreeWareNetworkNodeUserStateMap>,
  linkUserStateMap: Ref<TreeWareNetworkLinkUserStateMap>,
  compareNodes?: TreeWareNetworkNodeComparator,
  compareLinks?: TreeWareNetworkLinkComparator
) {
  const nodeUserStateCounts = ref(ZERO_NODE_COUNTS)
  const userGraph = computed(() => {
    const { graph, nodeCounts } = computeUserManipulatedGraph(
      inputGraph.value,
      nodeUserStateMap.value,
      linkUserStateMap.value
    )
    if (compareNodes) graph.sortNodes(compareNodes)
    if (compareLinks) graph.sortLinks(compareLinks)
    nodeUserStateCounts.value = nodeCounts
    return graph
  })
  return { userGraph, nodeUserStateCounts }
}

// TODO(deepak-nulu): split into separate computed graphs in different files.
function computeUserManipulatedGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  linkUserStateMap: TreeWareNetworkLinkUserStateMap
): {
  graph: TreeWareNetworkGraph
  nodeCounts: TreeWareNetworkNodeUserStateCounts
} {
  // Filter out hidden nodes, compute number of pinned nodes.
  const { unhiddenGraph, nodeCounts } = computeUnhiddenGraph(
    inputGraph,
    nodeUserStateMap,
    linkUserStateMap
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
  return { graph: pinnedGraph, nodeCounts }
}

function computeUnhiddenGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  linkUserStateMap: TreeWareNetworkLinkUserStateMap
): {
  unhiddenGraph: TreeWareNetworkGraph
  nodeCounts: TreeWareNetworkNodeUserStateCounts
} {
  const unhiddenRoot = cloneWithoutHierarchy(inputGraph.root)
  const unhiddenGraph = new TreeWareNetworkGraph(unhiddenRoot)
  // Add unhidden nodes to the graph.
  const nodeCounts = computeUnhiddenNode(
    inputGraph.root,
    nodeUserStateMap,
    inputGraph.root.parent,
    unhiddenGraph
  )
  // Add links to the graph.
  inputGraph.links.forEach(link => {
    if (
      unhiddenGraph.containsNode(link.source.id) &&
      unhiddenGraph.containsNode(link.target.id)
    ) {
      const linkUserState = linkUserStateMap[link.id]
      const unhiddenLink = cloneLink(link)
      unhiddenLink.isSelected =
        unhiddenLink.canSelect &&
        getLinkState('isSelected', linkUserState, unhiddenLink)
      unhiddenGraph.addLink(unhiddenLink)
    }
  })
  return { unhiddenGraph, nodeCounts }
}

function computeUnhiddenNode(
  inputNode: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  unhiddenParent: TreeWareNetworkNode | null,
  unhiddenGraph: TreeWareNetworkGraph
): TreeWareNetworkNodeUserStateCounts {
  const nodeUserState = nodeUserStateMap[inputNode.id]
  const isHidden = getNodeState('isHidden', nodeUserState, inputNode)
  if (isHidden) return { ...ZERO_NODE_COUNTS, hidden: 1 }
  // Root node will already be in `unhiddenGraph`.
  const unhiddenNode =
    unhiddenGraph.nodeMap[inputNode.id] ?? cloneWithoutHierarchy(inputNode)
  unhiddenNode.isPinned = getNodeState('isPinned', nodeUserState, inputNode)
  unhiddenNode.isExpanded = getNodeState('isExpanded', nodeUserState, inputNode)
  if (unhiddenParent) addChildToParent(unhiddenNode, unhiddenParent)
  unhiddenGraph.addNode(unhiddenNode)
  const childrenCounts =
    inputNode.group?.children.reduce(
      (nodeCounts, inputChild) =>
        addNodeCounts(
          nodeCounts,
          computeUnhiddenNode(
            inputChild,
            nodeUserStateMap,
            unhiddenNode,
            unhiddenGraph
          )
        ),
      ZERO_NODE_COUNTS
    ) ?? ZERO_NODE_COUNTS
  const nodeCounts: TreeWareNetworkNodeUserStateCounts = {
    hidden: 0,
    pinned: unhiddenNode.isPinned ? 1 : 0,
    collapsed: isNodeCollapsed(unhiddenNode) ? 1 : 0
  }
  return addNodeCounts(nodeCounts, childrenCounts)
}

type AncestorMap = { [nodeId: string]: TreeWareNetworkNode }

function computeGroupedGraph(
  inputGraph: TreeWareNetworkGraph
): TreeWareNetworkGraph {
  // Clone inputGraph
  const groupedGraph = new TreeWareNetworkGraph(inputGraph.root, inputGraph)
  // Create a map of collapsed nodes to their highest collapsed ancestors.
  // TODO(performance): compute the above map instead of collapsed count first.
  const ancestorMap: AncestorMap = {}
  computeAncestorMap(groupedGraph.root, ancestorMap)
  // Add links with ancestors.
  groupedGraph.links.forEach(link => {
    const groupLink = getGroupLinkForLink(link, groupedGraph, ancestorMap)
    if (groupLink) groupedGraph.addLink(groupLink)
  })
  return groupedGraph
}

function computeAncestorMap(
  node: TreeWareNetworkNode,
  ancestorMap: AncestorMap
) {
  if (isNodeCollapsed(node)) {
    addDescendantsToAncestorMap(node, ancestorMap, node)
  } else {
    node.group?.children.forEach(child =>
      computeAncestorMap(child, ancestorMap)
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
  const pinnedRoot = cloneWithoutHierarchy(inputGraph.root)
  const pinnedGraph = new TreeWareNetworkGraph(pinnedRoot)
  // Add pinned nodes and ancestors/descendents.
  computePinnedNode(
    inputGraph.root,
    nodeUserStateMap,
    inputGraph.root.parent,
    pinnedGraph
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

function computePinnedNode(
  inputNode: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  pinnedParent: TreeWareNetworkNode | null,
  pinnedGraph: TreeWareNetworkGraph
) {
  // Root node will already be in `pinnedGraph`.
  const pinnedNode =
    pinnedGraph.nodeMap[inputNode.id] ?? cloneWithoutHierarchy(inputNode)
  inputNode.group?.children.forEach(inputChild => {
    computePinnedNode(inputChild, nodeUserStateMap, pinnedNode, pinnedGraph)
  })
  const inputNodeIsPinned =
    getNodeState('isPinned', nodeUserStateMap[inputNode.id], inputNode) ?? false
  const pinnedNodeHasChildren =
    pinnedNode.group && pinnedNode.group.children.length > 0
  if (inputNodeIsPinned || pinnedNodeHasChildren) {
    if (pinnedParent) addChildToParent(pinnedNode, pinnedParent)
    pinnedGraph.addNode(pinnedNode)
  }
  if (inputNodeIsPinned) {
    // Add all immediate children if none of them are pinned.
    const hasPinnedImmediateChildren =
      inputNode.group?.children.some(inputChild =>
        getNodeState('isPinned', nodeUserStateMap[inputChild.id], inputChild)
      ) ?? false
    if (!hasPinnedImmediateChildren) {
      inputNode.group?.children.forEach(inputChild => {
        if (pinnedGraph.containsNode(inputChild.id)) return
        const includeChild = cloneSubHierarchy(inputChild)
        addChildToParent(includeChild, pinnedNode)
        pinnedGraph.addNode(includeChild)
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
  // Root node will already be in `to`.
  const toNode = to.nodeMap[fromNode.id] ?? cloneWithoutHierarchy(fromNode)
  if (toChild && toNode.group) toNode.group.children.push(toChild)
  if (fromNode.parent) {
    to.addNode(toNode)
    ensureNodeAndAncestors(fromNode.parent.id, from, to, toNode)
  }
}
