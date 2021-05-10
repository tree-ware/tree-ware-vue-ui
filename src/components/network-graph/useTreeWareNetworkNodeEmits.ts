import { SetupContext } from '@vue/composition-api'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'

export const CUSTOM_NODE_EVENT = 'custom-node-event'

export interface TreeWareNetworkNodeCustomEvent {
  name: string
  data: any
  source: TreeWareNetworkNode
}

export function useTreeWareNetworkNodeEmits(
  emit: SetupContext['emit'],
  usedBy: string = ''
) {
  function customNodeEvent(event: TreeWareNetworkNodeCustomEvent) {
    emit(CUSTOM_NODE_EVENT, event)
  }

  return { customNodeEvent }
}
