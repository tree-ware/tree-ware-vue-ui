import { Graph, Link, Node } from './TreeWareNetworkGraphInterfaces'

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
