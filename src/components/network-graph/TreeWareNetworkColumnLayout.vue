<template>
  <div class="tree-ware-network-column-layout">
    <div
      v-for="(column, index) in columns"
      :key="index"
      :class="['column', 'column' + index]"
    >
      <component
        v-if="column"
        :is="column.expandedContent"
        :id="column.id"
        :node="column"
        @pin-click="pinClick"
        @expand-click="expandClick"
        @hide-click="hideClick"
        @alert-click="alertClick"
        @zoom-click="zoomClick"
        @custom-node-event="customNodeEvent"
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
import { isColumnNodeData } from './ColumnNodeData'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import { useTreeWareNetworkNodeEmits } from './useTreeWareNetworkNodeEmits'
import { useTreeWareNetworkToolbarEmits } from './useTreeWareNetworkToolbarEmits'

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<TreeWareNetworkNode>,
      required: true
    }
  },
  setup(props, { emit }) {
    const { node } = toRefs(props)

    const columns: ComputedRef<(TreeWareNetworkNode | undefined)[]> = computed(
      () => {
        const maxColumnIndex =
          node.value.group?.children.reduce(
            (max, child) =>
              isColumnNodeData(child.data) && child.data.index > max
                ? child.data.index
                : max,
            0
          ) ?? 0
        const indexedColumns = new Array<TreeWareNetworkNode | undefined>(
          maxColumnIndex + 1
        )
        node.value.group?.children.forEach(child => {
          if (isColumnNodeData(child.data)) {
            indexedColumns[child.data.index] = child
          }
        })
        return indexedColumns
      }
    )

    return {
      columns,
      ...useTreeWareNetworkToolbarEmits(emit, 'TreeWareNetworkColumnLayout'),
      ...useTreeWareNetworkNodeEmits(emit, 'TreeWareNetworkColumnLayout')
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
