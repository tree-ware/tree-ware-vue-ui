import { Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkNodeUserStateMap } from './TreeWareNetworkNode'

export function useTreeWareNetworkGraphUnpinNodes(
  inputGraph: Ref<TreeWareNetworkGraph>,
  nodeUserStateMap: Ref<TreeWareNetworkNodeUserStateMap>
) {
  function unpinNodes() {
    // Accumulate changes so that they can be bulk applied.
    const unpin: TreeWareNetworkNodeUserStateMap = {}
    Object.values(inputGraph.value.nodeMap).forEach(node => {
      const nodeUserState = nodeUserStateMap.value[node.id] ?? node
      if (nodeUserState.isPinned) {
        unpin[node.id] = {
          ...nodeUserState,
          isPinned: false
        }
      }
    })
    // Bulk apply the changes.
    nodeUserStateMap.value = { ...nodeUserStateMap.value, ...unpin }
  }

  function hidePinnedNodes() {
    // Accumulate changes so that they can be bulk applied.
    const unpinAndHide: TreeWareNetworkNodeUserStateMap = {}
    Object.values(inputGraph.value.nodeMap).forEach(node => {
      const nodeUserState = nodeUserStateMap.value[node.id] ?? node
      if (nodeUserState.isPinned) {
        unpinAndHide[node.id] = {
          ...nodeUserState,
          isPinned: false,
          isHidden: true
        }
      }
    })
    // Bulk apply the changes.
    nodeUserStateMap.value = { ...nodeUserStateMap.value, ...unpinAndHide }
  }

  return { unpinNodes, hidePinnedNodes }
}
