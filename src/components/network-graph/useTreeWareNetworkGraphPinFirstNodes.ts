import { Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'

export function useTreeWareNetworkGraphPinFirstNodes(
  graph: Ref<TreeWareNetworkGraph>,
  isNodeHidden: (node: TreeWareNetworkNode) => boolean,
  isNodePinned: (node: TreeWareNetworkNode) => boolean,
  setNodeIsPinned: (node: TreeWareNetworkNode, isPinned: boolean) => void
) {
  function pinFirstNodeInColumn1() {
    pinFirstNodeInColumn(0)
  }

  function pinFirstNodeInColumn2() {
    pinFirstNodeInColumn(1)
  }

  function pinFirstNodeInColumn3() {
    pinFirstNodeInColumn(2)
  }

  function pinFirstNodeInColumn(columnIndex: number) {
    const columns = graph.value.root.group?.children
    if (!columns) return
    if (columns.length <= columnIndex) return
    const column = columns[columnIndex]
    const nodes = column.group?.children
    if (!nodes) return
    // TODO(deepak-nulu): depth first search instead of just one level.
    const node = nodes.find(node => !isNodeHidden(node) && !isNodePinned(node))
    if (node) pinNode(node)
  }

  function pinNode(node: TreeWareNetworkNode) {
    if (node.group && node.group.children.length) {
      pinNode(node.group.children[0])
    } else {
      setNodeIsPinned(node, true)
    }
  }

  return {
    pinFirstNodeInColumn1,
    pinFirstNodeInColumn2,
    pinFirstNodeInColumn3
  }
}
