import { ref } from '@vue/composition-api'
import {
  TreeWareNetworkLinkUserState,
  TreeWareNetworkLinkUserStateMap
} from './TreeWareNetworkLink'
import {
  TreeWareNetworkNodeUserState,
  TreeWareNetworkNodeUserStateMap
} from './TreeWareNetworkNode'
import {
  defaultTreeWareNetworkLinkUserState,
  defaultTreeWareNetworkNodeUserState
} from './TreeWareNetworkNodeUtil'

export function useTreeWareNetworkGraphUserState() {
  const nodeUserStateMap = ref<TreeWareNetworkNodeUserStateMap>({})
  const linkUserStateMap = ref<TreeWareNetworkLinkUserStateMap>({})

  function setNodeIsPinned(nodeId: string, isPinned: boolean) {
    setNodeState(nodeId, 'isPinned', isPinned)
  }

  function setNodeIsExpanded(nodeId: string, isExpanded: boolean) {
    setNodeState(nodeId, 'isExpanded', isExpanded)
  }

  function setNodeIsHidden(nodeId: string, isHidden: boolean) {
    setNodeState(nodeId, 'isHidden', isHidden)
  }

  function setNodeState<K extends keyof TreeWareNetworkNodeUserState>(
    nodeId: string,
    key: K,
    value: TreeWareNetworkNodeUserState[K]
  ) {
    const oldState = nodeUserStateMap.value[nodeId]
    if (oldState) oldState[key] = value
    else {
      const newState: TreeWareNetworkNodeUserState = {
        ...defaultTreeWareNetworkNodeUserState
      }
      newState[key] = value
      // TODO(performance): make `set()` Vue 2 composition API work below.
      nodeUserStateMap.value = {
        ...nodeUserStateMap.value,
        [nodeId]: newState
      }
    }
  }

  function setLinkIsSelected(linkId: string, isSelected: boolean) {
    setLinkState(linkId, 'isSelected', isSelected)
  }

  function setLinkState<K extends keyof TreeWareNetworkLinkUserState>(
    linkId: string,
    key: K,
    value: TreeWareNetworkLinkUserState[K]
  ) {
    const oldState = linkUserStateMap.value[linkId]
    if (oldState) oldState[key] = value
    else {
      const newState: TreeWareNetworkLinkUserState = {
        ...defaultTreeWareNetworkLinkUserState
      }
      newState[key] = value
      // TODO(performance): make `set()` Vue 2 composition API work below.
      linkUserStateMap.value = {
        ...linkUserStateMap.value,
        [linkId]: newState
      }
    }
  }

  return {
    nodeUserStateMap,
    linkUserStateMap,
    setNodeIsPinned,
    setNodeIsExpanded,
    setNodeIsHidden,
    setLinkIsSelected
  }
}
