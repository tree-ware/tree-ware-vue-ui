import { TreeWareNetworkLink } from './TreeWareNetworkLink'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'

export class TreeWareNetworkGraph {
  readonly columns: TreeWareNetworkNode[] = []
  readonly links: TreeWareNetworkLink[] = []
  readonly nodeMap: { [id: string]: TreeWareNetworkNode } = {}
  readonly linkMap: { [id: string]: TreeWareNetworkLink } = {}

  addColumn(column: TreeWareNetworkNode): boolean {
    if (!this.addNode(column)) return false
    this.columns.push(column)
    return true
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
}
