import { ObjectSet } from '../utilities/ObjectSet'
import { SimGraph, SimNode } from './TreeWareNetworkGraphInterfaces'

/**
 * Returns pinned nodes and the union of links connected to them.
 * Returns a copy of the input graph if there are no pinned nodes.
 */
export function getPinnedGraph<N, L>(simGraph: SimGraph<N, L>): SimGraph<N, L> {
  // Gather the set of links that are connected to pinned nodes.
  const pinnedSimLinks = simGraph.links.filter(
    simLink =>
      isNodeOrParentPinned(simLink.source) ||
      isNodeOrParentPinned(simLink.target)
  )

  // Return a copy of the input graph if there are no pinned nodes.
  // pinnedSimLinks will be empty when there are no pinned nodes.
  if (pinnedSimLinks.length === 0) {
    return { nodes: [...simGraph.nodes], links: [...simGraph.links] }
  }

  // Include all nodes from pinnedSimLinks.
  const nodeSet = new ObjectSet<SimNode<N>>(simNode => simNode.node.id)
  pinnedSimLinks.forEach(simLink => {
    nodeSet.add(simLink.source)
    nodeSet.add(simLink.target)
  })
  return { nodes: nodeSet.values(), links: pinnedSimLinks }
}

/** Returns true if the node or its collapsed parent is the pinned node. */
function isNodeOrParentPinned<N>(simNode: SimNode<N>): boolean {
  // NOTE: there is no property yet for indicating whether a group-node is
  // expanded or collapsed. It defaults to collapsed.
  return simNode.node.isPinned || (simNode.parent?.node.isPinned ?? false)
}
