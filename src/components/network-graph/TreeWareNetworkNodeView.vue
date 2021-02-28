<template>
  <div :id="node.id" :class="nodeClasses">
    <component
      :is="node.expandedContent"
      :node="node"
      @pin-click="pinClick"
      @expand-click="expandClick"
      @hide-click="hideClick"
      @alert-click="alertClick"
    />
    <template v-if="node.group && node.group.children.length">
      <div class="group-title">
        {{ node.group.children.length }}
        {{ node.group.name }}
      </div>

      <!-- If node is expanded, show children as nodes -->
      <div v-if="node.isExpanded" class="expanded">
        <tree-ware-network-node-view
          v-for="child in node.group.children"
          :key="child.id"
          :node="child"
          @pin-click="pinClick"
          @expand-click="expandClick"
          @hide-click="hideClick"
          @alert-click="alertClick"
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
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from '@vue/composition-api'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import { useTreeWareNetworkNode } from './useTreeWareNetworkNode'
import VuePerfectScrollbar from 'vue-perfect-scrollbar'
import { useTreeWareNetworkToolbarEmits } from '@/tree-ware-vue-ui/src/components/network-graph/useTreeWareNetworkToolbarEmits'

export default defineComponent({
  name: 'tree-ware-network-node-view',
  props: {
    node: { type: Object as PropType<TreeWareNetworkNode>, required: true }
  },
  components: { VuePerfectScrollbar },
  setup(props, { emit }) {
    const { node } = toRefs(props)
    return {
      ...useTreeWareNetworkNode(node),
      ...useTreeWareNetworkToolbarEmits(emit, 'TreeWareNetworkNodeView')
    }
  }
})
</script>

<style lang="scss" scoped>
.tree-ware-network-node-view {
  .group-title {
    border-top: solid 1px;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .expanded {
    .tree-ware-network-node-view {
      margin-top: 2.2rem;
    }
  }

  .collapsed {
    max-height: 92px;
  }
}
</style>
