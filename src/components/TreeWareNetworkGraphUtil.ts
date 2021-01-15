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

export function getId(...parts: string[]): string {
  return parts.join('--')
}
