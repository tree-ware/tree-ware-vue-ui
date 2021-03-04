<template>
  <div class="tree-ware-network-graph-view">
    <component
      :is="graph.root.expandedContent"
      :id="graph.root.id"
      :node="graph.root"
      @pin-click="pinClick"
      @expand-click="expandClick"
      @hide-click="hideClick"
      @alert-click="alertClick"
      class="root"
    />

    <svg class="links">
      <defs>
        <marker
          v-for="linkType in linkTypes"
          :key="linkType"
          :id="linkType"
          viewBox="0 -3 10 6"
          refX="10"
          refY="0"
          markerUnits="userSpaceOnUse"
          markerWidth="15"
          markerHeight="9"
          orient="auto"
        >
          <path d="M0,-3L10,0L0,3"></path>
        </marker>
      </defs>

      <tree-ware-network-link-view
        v-for="link in graph.links"
        ref="linksVue"
        :key="link.id"
        :link="link"
        :is-selectable="link.isSelectable"
        :column-gap="columnGap"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import { useTreeWareNetworkToolbarEmits } from '@/tree-ware-vue-ui/src/components/network-graph/useTreeWareNetworkToolbarEmits'
import {
  defineComponent,
  onUpdated,
  PropType,
  toRefs
} from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import TreeWareNetworkLinkView from './TreeWareNetworkLinkView.vue'
import { useTreeWareNetworkGraph } from './useTreeWareNetworkGraph'

export default defineComponent({
  props: {
    graph: { type: Object as PropType<TreeWareNetworkGraph>, required: true }
  },
  components: {
    TreeWareNetworkLinkView
  },
  setup(props, { emit, refs }) {
    const { graph } = toRefs(props)
    const { columnGap, linkTypes, updateLinkPaths } = useTreeWareNetworkGraph(
      refs,
      graph
    )

    onUpdated(() => {
      updateLinkPaths()
    })

    return {
      columnGap,
      linkTypes,
      ...useTreeWareNetworkToolbarEmits(emit, 'TreeWareNetworkGraphView')
    }
  }
})
</script>

<style lang="scss" scoped>
.tree-ware-network-graph-view {
  position: relative;
  display: flex;
  height: auto;

  .links {
    position: absolute;
    pointer-events: none; // link component re-enables pointer-events
    height: 100%;
    width: 100%;
  }

  marker#test {
    fill: gray;
  }
  .test {
    stroke: gray;
  }
}
</style>
