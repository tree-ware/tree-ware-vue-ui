import { computed, Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'

export function useTreeWareNetworkGraph(graph: Ref<TreeWareNetworkGraph>) {
  const columnGap = 200
  const linkTypes = computed(() => {
    return new Set<string>(graph.value.links.map(link => link.linkType))
  })

  return { columnGap, linkTypes }
}
