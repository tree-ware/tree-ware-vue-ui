import { getId } from '../../utilities/getId'
import TreeWareNetworkColumnLayout from './TreeWareNetworkColumnLayout.vue'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkLink } from './TreeWareNetworkLink'
import { defaultTreeWareNetworkLinkUserState } from './TreeWareNetworkLinkUtil'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import {
  addChildToParent,
  defaultTreeWareNetworkNodeUserState,
  treeWareNetworkNodeUserControlNone
} from './TreeWareNetworkNodeUtil'
import TreeWareNetworkTestNode from './TreeWareNetworkTestNode.vue'
import { TreeWareNetworkTestNodeData } from './TreeWareNetworkTestNodeData'

export function getTestGraph(): TreeWareNetworkGraph {
  const root = createTestRoot()
  const graph = new TreeWareNetworkGraph(root)
  const node1 = createTestNode('node1')
  const node2 = createTestNode('node2')
  const node3 = createTestNode('node3')
  addChildToParent(node1, root, graph)
  addChildToParent(node2, root, graph)
  addChildToParent(node3, root, graph)

  const node11 = createTestNode('node11')
  const node21 = createTestNode('node21')
  const node31 = createTestNode('node31')
  addChildToParent(node11, node1, graph)
  addChildToParent(node21, node2, graph)
  addChildToParent(node31, node3, graph)

  createAndAddTestLink(graph, node1, node2)
  createAndAddTestLink(graph, node11, node21)

  return graph
}

function createTestRoot(): TreeWareNetworkNode {
  return {
    id: '__ROOT__',
    parent: null,
    group: {
      name: 'Test',
      children: []
    },
    classes: [],
    expandedContent: TreeWareNetworkColumnLayout,
    collapsedContent: null,
    data: null,
    ...defaultTreeWareNetworkNodeUserState,
    isExpanded: true,
    ...treeWareNetworkNodeUserControlNone
  }
}

function createTestNode(name: string): TreeWareNetworkNode {
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

function createAndAddTestLink(
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
