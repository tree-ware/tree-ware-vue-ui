import {
  TreeWareNetworkLink,
  TreeWareNetworkLinkUserState,
  TreeWareNetworkLinkUserStateCounts
} from './TreeWareNetworkLink'

export const ZERO_LINK_COUNTS: TreeWareNetworkLinkUserStateCounts = {
  selected: 0,
  total: 0
}

export function addLinkCounts(
  a: TreeWareNetworkLinkUserStateCounts,
  b: TreeWareNetworkLinkUserStateCounts
): TreeWareNetworkLinkUserStateCounts {
  return {
    selected: a.selected + b.selected,
    total: a.total + b.total
  }
}

export function getLinkState<K extends keyof TreeWareNetworkLinkUserState>(
  key: K,
  linkUserState: TreeWareNetworkLinkUserState,
  link: TreeWareNetworkLink
): TreeWareNetworkLinkUserState[K] {
  return linkUserState ? linkUserState[key] : link[key]
}
