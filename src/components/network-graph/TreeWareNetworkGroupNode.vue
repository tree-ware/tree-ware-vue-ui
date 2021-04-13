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
    <img
      v-if="imgImage"
      :src="imgImage.src"
      :height="imgImage.height"
      :alt="imgImage.alt"
    />
    <div v-else-if="divImage" :class="divImage.classes">
      {{ divImage.content }}
    </div>
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
    TreeWareNetworkNestedLayout,
    TreeWareNetworkNodeToolbar
  },
  setup(props, { emit }) {
    const { node } = toRefs(props)

    const imgImage = computed(() => node.value.group?.imgImage)
    const divImage = computed(() => node.value.group?.divImage)
    const label = computed(() => node.value.group?.name)

    const userControlTooltip: TreeWareNetworkNodeToolbarTooltip = {
      ...defaultTreeWareNetworkNodeToolbarTooltip,
      canPin: 'Pin this group',
      canExpand: 'Expand/collapse this group',
      canHide: 'Hide this group',
      canZoom: 'Zoom into this group'
    }

    return {
      imgImage,
      divImage,
      label,
      userControlTooltip,
      ...useTreeWareNetworkToolbarEmits(emit)
    }
  }
})
</script>
