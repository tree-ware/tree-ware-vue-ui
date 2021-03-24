<template>
  <div
    v-if="node.group && node.group.children.length"
    class="tree-ware-network-nested-layout"
  >
    <div class="group-title">
      {{ node.group.children.length }}
      {{ node.group.name }}
    </div>

    <!-- If node is expanded, show children as nodes -->
    <div v-if="node.isExpanded" class="expanded">
      <component
        v-for="child in node.group.children"
        :key="child.id"
        :is="child.expandedContent"
        :id="child.id"
        :node="child"
        @pin-click="pinClick"
        @expand-click="expandClick"
        @hide-click="hideClick"
        @alert-click="alertClick"
        @zoom-click="zoomClick"
        :class="child.classes"
      />
    </div>
    <!-- If node is collapsed, show children directly in a scroll area -->
    <VuePerfectScrollbar v-else class="collapsed">
      <template v-for="child in node.group.children">
        <component
          v-if="child.collapsedContent"
          :key="child.id"
          :is="child.collapsedContent"
          :node="child"
        />
      </template>
    </VuePerfectScrollbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import VuePerfectScrollbar from 'vue-perfect-scrollbar'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import { useTreeWareNetworkToolbarEmits } from './useTreeWareNetworkToolbarEmits'

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<TreeWareNetworkNode>,
      required: true
    }
  },
  components: { VuePerfectScrollbar },
  setup(props, { emit }) {
    return {
      ...useTreeWareNetworkToolbarEmits(emit, 'TreeWareNetworkNestedLayout')
    }
  }
})
</script>

<style lang="scss" scoped>
.tree-ware-network-nested-layout {
  .group-title {
    border-top: solid 1px;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .expanded {
    display: grid;
    grid-gap: 2.2rem;
    margin-top: 1rem;
  }

  .collapsed {
    max-height: 92px;
    margin-top: 1rem;
  }
}
</style>
