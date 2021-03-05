import {
  TreeWareNetworkLink,
  TreeWareNetworkLinkUserState
} from './TreeWareNetworkLink'

export const defaultTreeWareNetworkLinkUserState: TreeWareNetworkLinkUserState = {
  isSelected: false
}

export function cloneLink(link: TreeWareNetworkLink): TreeWareNetworkLink {
  return {
    ...link
  }
}
