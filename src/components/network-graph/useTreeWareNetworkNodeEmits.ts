import { SetupContext } from '@vue/composition-api'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'

export const CUSTOM_NODE_EVENT = 'custom-node-event'

export function useTreeWareNetworkNodeEmits(
  emit: SetupContext['emit'],
  usedBy: string = ''
) {
  function customNodeEvent(
    eventName: string,
    eventData: any,
    node: TreeWareNetworkNode
  ) {
    emit(CUSTOM_NODE_EVENT, eventName, eventData, node)
  }

  return { customNodeEvent }
}
