import {
  computed,
  onBeforeUnmount,
  onMounted,
  Ref,
  SetupContext
} from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import TreeWareNetworkLinkView from './TreeWareNetworkLinkView.vue'

export function useTreeWareNetworkGraph(
  refs: SetupContext['refs'],
  graph: Ref<TreeWareNetworkGraph>
) {
  const columnGap = 200
  const linkTypes = computed(() => {
    return new Set<string>(graph.value.links.map(link => link.linkType))
  })

  function updateLinkPaths() {
    // NOTE: composition API does not support ref with v-for in Vue 2.
    // So we have to use refs passed in the context to setup().
    const linkViews =
      (refs.linksVue as InstanceType<typeof TreeWareNetworkLinkView>[]) ?? []
    linkViews.forEach(linkView => linkView.updateLinkPaths())
  }

  // TODO(performance): watch only the size of the graph component.
  const updateEvents = ['resize', 'animationend', 'transitionend']

  onMounted(() => {
    updateEvents.forEach(event =>
      window.addEventListener(event, updateLinkPaths)
    )
  })

  onBeforeUnmount(() => {
    updateEvents.forEach(event =>
      window.removeEventListener(event, updateLinkPaths)
    )
  })

  return { columnGap, linkTypes, updateLinkPaths }
}
