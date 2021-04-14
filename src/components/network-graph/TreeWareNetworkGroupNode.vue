<template>
  <div :class="node.classes">
    <tree-ware-network-node-toolbar
      :node="node"
      :user-control-tooltip="userControlTooltip"
      @pin-click="pinClick"
      @expand-click="expandClick"
      @hide-click="hideClick"
      @zoom-click="zoomClick"
      @alert-click="alertClick"
    />
    <tree-ware-image
      v-if="node.group && node.group.image"
      :image-data="node.group.image"
    />
    <div v-if="label">{{ label }}</div>
    <tree-ware-network-nested-layout
      :node="node"
      @pin-click="pinClick"
      @expand-click="expandClick"
      @hide-click="hideClick"
      @zoom-click="zoomClick"
      @alert-click="alertClick"
    />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  toRefs
} from '@vue/composition-api'
import TreeWareImage from '../image/TreeWareImage.vue'
import defaultTreeWareNetworkNodeToolbarTooltip from './defaultTreeWareNetworkNodeToolbarTooltip'
import TreeWareNetworkNestedLayout from './TreeWareNetworkNestedLayout.vue'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import TreeWareNetworkNodeToolbar from './TreeWareNetworkNodeToolbar.vue'
import { TreeWareNetworkNodeToolbarTooltip } from './TreeWareNetworkNodeToolbarTypes'
import { useTreeWareNetworkToolbarEmits } from './useTreeWareNetworkToolbarEmits'

export default defineComponent({
  props: {
    node: { type: Object as PropType<TreeWareNetworkNode>, required: true }
  },
  components: {
    TreeWareImage,
    TreeWareNetworkNestedLayout,
    TreeWareNetworkNodeToolbar
  },
  setup(props, { emit }) {
    const { node } = toRefs(props)

    const label = computed(() => node.value.group?.name)

    const userControlTooltip: TreeWareNetworkNodeToolbarTooltip = {
      ...defaultTreeWareNetworkNodeToolbarTooltip,
      canPin: 'Pin this group',
      canExpand: 'Expand/collapse this group',
      canHide: 'Hide this group',
      canZoom: 'Zoom into this group'
    }

    return {
      label,
      userControlTooltip,
      ...useTreeWareNetworkToolbarEmits(emit)
    }
  }
})
</script>
