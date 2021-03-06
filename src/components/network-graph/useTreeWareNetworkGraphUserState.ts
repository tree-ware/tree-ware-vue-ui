import { ref } from '@vue/composition-api'
import {
  TreeWareNetworkLink,
  TreeWareNetworkLinkUserState,
  TreeWareNetworkLinkUserStateMap
} from './TreeWareNetworkLink'
import { getLinkState } from './TreeWareNetworkLinkUserStateUtil'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeUserState,
  TreeWareNetworkNodeUserStateMap
} from './TreeWareNetworkNode'
import { getNodeState } from './TreeWareNetworkNodeUserStateUtil'

export function useTreeWareNetworkGraphUserState() {
  const nodeUserStateMap = ref<TreeWareNetworkNodeUserStateMap>({})
  const linkUserStateMap = ref<TreeWareNetworkLinkUserStateMap>({})

  function isNodePinned(node: TreeWareNetworkNode): boolean {
    const nodeUserState = nodeUserStateMap.value[node.id]
    return getNodeState('isPinned', nodeUserState, node)
  }

  function setNodeIsPinned(node: TreeWareNetworkNode, isPinned: boolean) {
    setNodeState(node, 'isPinned', isPinned)
  }

  function isNodeExpanded(node: TreeWareNetworkNode): boolean {
    const nodeUserState = nodeUserStateMap.value[node.id]
    return getNodeState('isExpanded', nodeUserState, node)
  }

  function setNodeIsExpanded(node: TreeWareNetworkNode, isExpanded: boolean) {
    setNodeState(node, 'isExpanded', isExpanded)
  }

  function isNodeHidden(node: TreeWareNetworkNode): boolean {
    const nodeUserState = nodeUserStateMap.value[node.id]
    return getNodeState('isHidden', nodeUserState, node)
  }

  function setNodeIsHidden(node: TreeWareNetworkNode, isHidden: boolean) {
    setNodeState(node, 'isHidden', isHidden)
  }

  function setNodeState<K extends keyof TreeWareNetworkNodeUserState>(
    node: TreeWareNetworkNode,
    key: K,
    value: TreeWareNetworkNodeUserState[K]
  ) {
    // We don't modify the node itself, we only use it for the rest of the state.
    const oldState = nodeUserStateMap.value[node.id]
    if (oldState) oldState[key] = value
    else {
      const newState: TreeWareNetworkNodeUserState = {
        ...(node as TreeWareNetworkNodeUserState)
      }
      newState[key] = value // not type-safe if included above
      // TODO(performance): make `set()` Vue 2 composition API work below.
      nodeUserStateMap.value = {
        ...nodeUserStateMap.value,
        [node.id]: newState
      }
    }
  }

  function toggleLinkSelection(link: TreeWareNetworkLink) {
    const linkUserState = linkUserStateMap.value[link.id]
    const isSelected = getLinkState('isSelected', linkUserState, link)
    setLinkState(link, 'isSelected', !isSelected)
  }

  function setLinkState<K extends keyof TreeWareNetworkLinkUserState>(
    link: TreeWareNetworkLink,
    key: K,
    value: TreeWareNetworkLinkUserState[K]
  ) {
    // We don't modify the link itself, we only use it for the rest of the state.
    const oldState = linkUserStateMap.value[link.id]
    if (oldState) oldState[key] = value
    else {
      const newState: TreeWareNetworkLinkUserState = {
        ...(link as TreeWareNetworkLinkUserState)
      }
      newState[key] = value // not type-safe if included above
      // TODO(performance): make `set()` Vue 2 composition API work below.
      linkUserStateMap.value = {
        ...linkUserStateMap.value,
        [link.id]: newState
      }
    }
  }

  return {
    nodeUserStateMap,
    linkUserStateMap,
    isNodePinned,
    setNodeIsPinned,
    isNodeExpanded,
    setNodeIsExpanded,
    isNodeHidden,
    setNodeIsHidden,
    toggleLinkSelection
  }
}
