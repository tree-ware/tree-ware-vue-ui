import { computed, Ref, watch } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkLinkUserStateMap } from './TreeWareNetworkLink'
import {
  addLinkCounts,
  getLinkState,
  ZERO_LINK_COUNTS
} from './TreeWareNetworkLinkUserStateUtil'

export function useTreeWareNetworkGraphLinkSelection(
  inputGraph: Ref<TreeWareNetworkGraph>,
  linkUserStateMap: Ref<TreeWareNetworkLinkUserStateMap>,
  selectAllLinksCheckbox?: Ref<HTMLInputElement | null>
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

  const isNoLinkSelected = computed(
    () => linkUserStateCounts.value.selected === 0
  )

  const isFewLinksSelected = computed(
    () =>
      0 < linkUserStateCounts.value.selected &&
      linkUserStateCounts.value.selected < linkUserStateCounts.value.total
  )

  const isAllLinksSelected = computed(
    () =>
      linkUserStateCounts.value.selected > 0 &&
      linkUserStateCounts.value.selected === linkUserStateCounts.value.total
  )

  if (selectAllLinksCheckbox) {
    watch(isFewLinksSelected, selected => {
      if (selectAllLinksCheckbox.value) {
        selectAllLinksCheckbox.value.indeterminate = selected
      }
    })
  }

  function selectAllLinks() {
    setIsSelectedForAllLinks(true)
  }

  function unselectAllLinks() {
    setIsSelectedForAllLinks(false)
  }

  function setIsSelectedForAllLinks(isSelected: boolean) {
    // Accumulate changes so that they can be bulk applied.
    const changes: TreeWareNetworkLinkUserStateMap = {}
    inputGraph.value.links.forEach(link => {
      const linkUserState = linkUserStateMap.value[link.id] ?? link
      changes[link.id] = {
        ...linkUserState,
        isSelected
      }
    })
    // Bulk apply the changes.
    linkUserStateMap.value = { ...linkUserStateMap.value, ...changes }
  }

  function toggleSelectAllLinks(event: any) {
    if (isAllLinksSelected) unselectAllLinks()
    else selectAllLinks()
  }

  return {
    linkUserStateCounts,
    isNoLinkSelected,
    isFewLinksSelected,
    isAllLinksSelected,
    selectAllLinks,
    unselectAllLinks,
    toggleSelectAllLinks
  }
}
