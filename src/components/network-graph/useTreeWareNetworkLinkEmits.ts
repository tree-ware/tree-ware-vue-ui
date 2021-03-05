import { SetupContext } from '@vue/composition-api'
import { TreeWareNetworkLink } from './TreeWareNetworkLink'

export function useTreeWareNetworkLinkEmits(
  emit: SetupContext['emit'],
  usedBy: string = ''
) {
  function linkClick(link: TreeWareNetworkLink) {
    emit('link-click', link)
  }

  return { linkClick }
}
