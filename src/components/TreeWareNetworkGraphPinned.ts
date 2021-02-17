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

  // For pinned and expanded groups, include all children if none are pinned.
  simGraph.nodes.forEach(simNode => {
    if (!simNode.node.isPinned) return
    if (!simNode.node.group) return
    if (!simNode.node.group.isExpanded) return
    const hasPinnedChild = simNode.node.group.children.some(
      child => child.isPinned
    )
    if (hasPinnedChild) return
    simNode.allChildren?.forEach(simChild => {
      if (simChild.node.isHidden) return
      nodeSet.add(simChild)
    })
  })

  return { nodes: nodeSet.values(), links: pinnedSimLinks }
}

function isNodeOrCollapsedParentPinned<N>(simNode: SimNode<N>): boolean {
  if (simNode.node.isPinned) return true
  if (!simNode.parent) return false
  if (simNode.parent.node.group?.isExpanded) return false // parent is not collapsed
  return simNode.parent.node.isPinned
}
