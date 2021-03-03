<template>
  <div class="tree-ware-network-column-layout">
    <div
      v-for="(column, index) in columns"
      :key="index"
      :class="['column', 'column' + index]"
    >
      <tree-ware-network-node-view
        v-if="column"
        :node="column"
        @pin-click="pinClick"
        @expand-click="expandClick"
        @hide-click="hideClick"
        @alert-click="alertClick"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  ComputedRef,
  defineComponent,
  PropType,
  toRefs
} from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import TreeWareNetworkNodeView from './TreeWareNetworkNodeView.vue'
import { useTreeWareNetworkToolbarEmits } from './useTreeWareNetworkToolbarEmits'

export default defineComponent({
  props: {
    graph: {
      type: Object as PropType<TreeWareNetworkGraph>,
      required: true
    }
  },
  components: {
    TreeWareNetworkNodeView
  },
  setup(props, { emit }) {
    const { graph } = toRefs(props)

    const columns: ComputedRef<(TreeWareNetworkNode | undefined)[]> = computed(
      () => {
        const maxColumnIndex = graph.value.columns.reduce(
          (max, column) => (column.data.index > max ? column.data.index : max),
          0
        )
        const indexedColumns = new Array<TreeWareNetworkNode | undefined>(
          maxColumnIndex + 1
        )
        graph.value.columns.forEach(column => {
          indexedColumns[column.data.index] = column
        })
        return indexedColumns
      }
    )

    return {
      columns,
      ...useTreeWareNetworkToolbarEmits(emit, 'TreeWareNetworkColumnLayout')
    }
  }
})
</script>

<style lang="scss" scoped>
.tree-ware-network-column-layout {
  display: grid;
  grid-gap: 210px;
  grid-template-areas: 'column0 column1 column2';

  .column {
    min-width: 210px;
  }
}
</style>
