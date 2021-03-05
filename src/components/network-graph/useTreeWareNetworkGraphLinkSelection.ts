import { computed, Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkLinkUserStateMap } from './TreeWareNetworkLink'
import {
  addLinkCounts,
  getLinkState,
  ZERO_LINK_COUNTS
} from './TreeWareNetworkLinkUserStateUtil'

export function useTreeWareNetworkGraphLinkSelection(
  inputGraph: Ref<TreeWareNetworkGraph>,
  linkUserStateMap: Ref<TreeWareNetworkLinkUserStateMap>
) {
  const linkUserStateCounts = computed(() =>
    inputGraph.value.links.reduce((linkCounts, link) => {
      const linkUserState = linkUserStateMap.value[link.id]
      const isSelected = getLinkState('isSelected', linkUserState, link)
      return addLinkCounts(linkCounts, {
        selected: isSelected ? 1 : 0,
        total: 1
      })
    }, ZERO_LINK_COUNTS)
  )

  function isNoLinkSelected(): boolean {
    return linkUserStateCounts.value.selected === 0
  }

  function isFewLinksSelected(): boolean {
    return (
      0 < linkUserStateCounts.value.selected &&
      linkUserStateCounts.value.selected < linkUserStateCounts.value.total
    )
  }

  function isAllLinksSelected(): boolean {
    return (
      linkUserStateCounts.value.selected > 0 &&
      linkUserStateCounts.value.selected === linkUserStateCounts.value.total
    )
  }

  return {
    linkUserStateCounts,
    isNoLinkSelected,
    isFewLinksSelected,
    isAllLinksSelected
  }
}
