import { Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkNodeUserStateMap } from './TreeWareNetworkNode'

export function useTreeWareNetworkGraphUnhideNodes(
  inputGraph: Ref<TreeWareNetworkGraph>,
  nodeUserStateMap: Ref<TreeWareNetworkNodeUserStateMap>
) {
  function unhideNodes() {
    // Accumulate changes so that they can be bulk applied.
    const unhide: TreeWareNetworkNodeUserStateMap = {}
    Object.values(inputGraph.value.nodeMap).forEach(node => {
      const nodeUserState = nodeUserStateMap.value[node.id] ?? node
      if (nodeUserState.isHidden) {
        unhide[node.id] = {
          ...nodeUserState,
          isHidden: false
        }
      }
    })
    // Bulk apply the changes.
    nodeUserStateMap.value = { ...nodeUserStateMap.value, ...unhide }
  }

  return { unhideNodes }
}
