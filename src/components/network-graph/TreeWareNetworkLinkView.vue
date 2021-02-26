<template>
  <g :class="linkClasses">
    <path class="link-start" :marker-end="arrowHeadUrl" :d="linkPaths[0]" />
    <path class="link-end" :d="linkPaths[1]" />
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from '@vue/composition-api'
import { TreeWareNetworkLink } from './TreeWareNetworkLink'
import { useTreeWareNetworkLink } from './useTreeWareNetworkLink'

export default defineComponent({
  props: {
    link: { type: Object as PropType<TreeWareNetworkLink>, required: true },
    columnGap: { type: Number, default: 100 }
  },
  setup(props) {
    const { link, columnGap } = toRefs(props)
    return useTreeWareNetworkLink(link, columnGap)
  }
})
</script>

<style lang="scss" scoped>
$default-link-width: 1px;
$default-hover-link-width: 3px;
$selected-link-width: 4px;
$selected-hover-link-width: 5px;

.tree-ware-network-link-view {
  pointer-events: auto;
  fill: none;
  stroke-width: $default-link-width;

  &.selectable {
    cursor: pointer;

    &:hover {
      stroke-width: $default-hover-link-width;
    }

    &.selected {
      stroke-width: $selected-link-width;

      &:hover {
        stroke-width: $selected-hover-link-width;
      }
    }
  }
}
</style>
