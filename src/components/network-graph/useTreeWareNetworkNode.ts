import { computed, Ref } from '@vue/composition-api'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'

export function useTreeWareNetworkNode(node: Ref<TreeWareNetworkNode>) {
  const nodeClasses = computed(() => [
    'tree-ware-network-node-view',
    ...node.value.classes
  ])

  return { nodeClasses }
}
