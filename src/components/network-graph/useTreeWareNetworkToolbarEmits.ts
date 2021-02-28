import { SetupContext } from '@vue/composition-api'

export function useTreeWareNetworkToolbarEmits(
  emit: SetupContext['emit'],
  usedBy: string = ''
) {
  function pinClick(nodeId: string, isPinned: boolean) {
    emit('pin-click', nodeId, isPinned)
  }

  function expandClick(nodeId: string, isExpanded: boolean) {
    emit('expand-click', nodeId, isExpanded)
  }

  function hideClick(nodeId: string, isHidden: boolean) {
    emit('hide-click', nodeId, isHidden)
  }

  function alertClick(nodeId: string) {
    emit('alert-click', nodeId)
  }

  return {
    pinClick,
    expandClick,
    hideClick,
    alertClick
  }
}
