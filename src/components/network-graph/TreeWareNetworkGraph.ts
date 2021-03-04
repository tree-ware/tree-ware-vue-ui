import {
  TreeWareNetworkLink,
  TreeWareNetworkLinkComparator
} from './TreeWareNetworkLink'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeComparator
} from './TreeWareNetworkNode'
import { sortNodeChildren } from './TreeWareNetworkNodeUtil'

export class TreeWareNetworkGraph {
  readonly links: TreeWareNetworkLink[]
  readonly nodeMap: { [id: string]: TreeWareNetworkNode }
  readonly linkMap: { [id: string]: TreeWareNetworkLink }

  constructor(
    readonly root: TreeWareNetworkNode,
    graph?: TreeWareNetworkGraph // shallow cloned if specified
  ) {
    this.links = graph ? [...graph.links] : []
    this.nodeMap = graph ? { ...graph.nodeMap } : {}
    this.linkMap = graph ? { ...graph.linkMap } : {}
    this.addNode(root)
  }

  addNode(node: TreeWareNetworkNode): boolean {
    if (this.nodeMap[node.id]) return false
    this.nodeMap[node.id] = node
    return true
  }

  addLink(link: TreeWareNetworkLink): boolean {
    if (this.linkMap[link.id]) return false
    this.linkMap[link.id] = link
    this.links.push(link)
    return true
  }

  containsNode(nodeId: string): boolean {
    return Boolean(this.nodeMap[nodeId])
  }

  sortNodes(compareNodes: TreeWareNetworkNodeComparator) {
    this.root.group?.children.sort(compareNodes)
    this.root.group?.children.forEach(child =>
      sortNodeChildren(child, compareNodes)
    )
  }

  sortLinks(compareLinks: TreeWareNetworkLinkComparator) {
    this.links.sort(compareLinks)
  }
}
