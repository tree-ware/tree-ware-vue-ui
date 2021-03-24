import { SetupContext } from '@vue/composition-api'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'

export function useTreeWareNetworkToolbarEmits(
  emit: SetupContext['emit'],
  usedBy: string = ''
) {
  function pinClick(node: TreeWareNetworkNode, newIsPinned: boolean) {
    emit('pin-click', node, newIsPinned)
  }

  function expandClick(node: TreeWareNetworkNode, newIsExpanded: boolean) {
    emit('expand-click', node, newIsExpanded)
  }

  function hideClick(node: TreeWareNetworkNode, newIsHidden: boolean) {
    emit('hide-click', node, newIsHidden)
  }

  function alertClick(node: TreeWareNetworkNode) {
    emit('alert-click', node)
  }

  function zoomClick(data: any) {
    emit('zoom-click', data)
  }

  return {
    pinClick,
    expandClick,
    hideClick,
    alertClick,
    zoomClick
  }
}
