<template>
  <div class="tree-ware-network-graph-view">
    <div class="nodes">
      <tree-ware-network-node-view
        v-for="column in graph.columns"
        :key="column.id"
        :node="column"
      />
    </div>

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
import {
  defineComponent,
  onUpdated,
  PropType,
  toRefs
} from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import TreeWareNetworkLinkView from './TreeWareNetworkLinkView.vue'
import TreeWareNetworkNodeView from './TreeWareNetworkNodeView.vue'
import { useTreeWareNetworkGraph } from './useTreeWareNetworkGraph'
import Vue from 'vue'

export default defineComponent({
  props: {
    graph: { type: Object as PropType<TreeWareNetworkGraph>, required: true }
  },
  components: {
    TreeWareNetworkLinkView,
    TreeWareNetworkNodeView
  },
  setup(props, { refs }) {
    const { graph } = toRefs(props)
    const { columnGap, linkTypes, updateLinkPaths } = useTreeWareNetworkGraph(
      refs,
      graph
    )

    onUpdated(() => {
      updateLinkPaths()
    })

    return { columnGap, linkTypes }
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

  .nodes {
    background: transparent;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: auto;
  }

  marker#test {
    fill: gray;
  }
  .test {
    stroke: gray;
  }
}
</style>
