import {
  Graph,
  Link,
  LookupGraph,
  Node
} from './TreeWareNetworkGraphInterfaces'

export function newEmptyLookupGraph<N, L>(): LookupGraph<N, L> {
  return {
    nodes: [],
    links: [],
    nodeMap: {},
    linkMap: {}
  }
}

export function addNodeToLookupGraph<N, L>(
  node: Node<N>,
  graph: LookupGraph<N, L>
): boolean {
  if (graph.nodeMap[node.id]) return false
  graph.nodeMap[node.id] = node
  graph.nodes.push(node)
  return true
}

export function addLinkToLookupGraph<N, L>(
  link: Link<L>,
  graph: LookupGraph<N, L>
): boolean {
  const linkId = getId(link.sourceId, link.targetId, link.linkType)
  if (graph.linkMap[linkId]) return false
  graph.linkMap[linkId] = link
  graph.links.push(link)
  return true
}

export function addNode<N, L>(
  node: Node<N>,
  graph: Graph<N, L>,
  nodeIdSet: Set<string>
): boolean {
  if (nodeIdSet.has(node.id)) return false
  nodeIdSet.add(node.id)
  graph.nodes.push(node)
  return true
}

export function addLink<N, L>(
  link: Link<L>,
  graph: Graph<N, L>,
  linkIdSet: Set<string>
): boolean {
  const linkId = getId(link.sourceId, link.targetId, link.linkType)
  if (linkIdSet.has(linkId)) return false
  linkIdSet.add(linkId)
  graph.links.push(link)
  return true
}

export function getPinnedCount<N, L>(graph: Graph<N, L>): number {
  return graph.nodes.reduce(
    (count, node) => (node.isPinned ? count + 1 : count),
    0
  )
}

export function getHiddenCount<N, L>(graph: Graph<N, L>): number {
  return graph.nodes.reduce(
    (count, node) => (node.isHidden ? count + 1 : count),
    0
  )
}

export function updateIsPinned<N>(node: Node<N>, isPinned: boolean) {
  node.wasPinned = node.wasPinned || node.isPinned
  node.isPinned = isPinned
}

export function unpinAll<N, L>(graph: LookupGraph<N, L>) {
  graph.nodes.forEach(node => {
    updateIsPinned(node, false)
  })
}

export function unhideAll<N, L>(graph: LookupGraph<N, L>) {
  graph.nodes.forEach(node => {
    node.isHidden = false
  })
}

export function getId(...parts: any[]): string {
  return parts.join('--')
}
