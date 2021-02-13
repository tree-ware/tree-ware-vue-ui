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
      isNodeOrCollapsedParentPinned(simLink.source) ||
      isNodeOrCollapsedParentPinned(simLink.target)
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

function isNodeOrCollapsedParentPinned<N>(simNode: SimNode<N>): boolean {
  if (simNode.node.isPinned) return true
  if (!simNode.parent) return false
  if (simNode.parent.node.isExpanded) return false // parent is not collapsed
  return simNode.parent.node.isPinned
}
