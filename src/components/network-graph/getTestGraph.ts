import { getId } from '../../utilities/getId'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import {
  defaultTreeWareNetworkLinkUserState,
  TreeWareNetworkLink
} from './TreeWareNetworkLink'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import {
  addChildToParent,
  defaultTreeWareNetworkNodeUserState,
  treeWareNetworkNodeUserControlNone
} from './TreeWareNetworkNodeUtil'
import TreeWareNetworkTestNode from './TreeWareNetworkTestNode.vue'
import { TreeWareNetworkTestNodeData } from './TreeWareNetworkTestNodeData'

export function getTestGraph(): TreeWareNetworkGraph {
  const graph = new TreeWareNetworkGraph()
  const node1 = getTestNode('node1')
  const node2 = getTestNode('node2')
  const node3 = getTestNode('node3')

  const node11 = getTestNode('node11')
  const node21 = getTestNode('node21')
  const node31 = getTestNode('node31')
  addChildToParent(node11, node1)
  addChildToParent(node21, node2)
  addChildToParent(node31, node3)

  addTestLink(graph, node1, node2)
  addTestLink(graph, node11, node21)

  graph.addColumn(node1)
  graph.addColumn(node2)
  graph.addColumn(node3)

  return graph
}

function getTestNode(name: string): TreeWareNetworkNode {
  return {
    id: getId(name),
    parent: null,
    group: {
      name,
      children: []
    },
    classes: [],
    expandedContent: TreeWareNetworkTestNode,
    collapsedContent: null,
    data: { name } as TreeWareNetworkTestNodeData,
    ...defaultTreeWareNetworkNodeUserState,
    isExpanded: true,
    ...treeWareNetworkNodeUserControlNone
  }
}

function addTestLink(
  graph: TreeWareNetworkGraph,
  source: TreeWareNetworkNode,
  target: TreeWareNetworkNode
) {
  const link: TreeWareNetworkLink = {
    id: getId(source.id, target.id),
    source,
    target,
    linkType: 'test',
    classes: ['test'],
    data: null,
    ...defaultTreeWareNetworkLinkUserState,
    canSelect: true
  }
  graph.addLink(link)
}
