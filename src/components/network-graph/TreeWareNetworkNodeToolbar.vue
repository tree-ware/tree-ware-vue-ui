<template>
  <div class="tree-ware-network-node-toolbar">
    <div class="toolbar flex flex-row mb-2">
      <vx-tooltip
        v-if="node.canPin"
        :text="userControlTooltip.canPin"
        :class="['pin', { 'is-pinned': node.isPinned }, 'mr-2']"
      >
        <a @click="pinClick(node, !node.isPinned)">
          <vs-icon
            icon="fa-thumbtack"
            icon-pack="fas"
            :color="node.isPinned ? pinnedPinColor : 'primary'"
          ></vs-icon>
        </a>
      </vx-tooltip>

      <vx-tooltip
        v-if="node.canExpand"
        :text="userControlTooltip.canExpand"
        class="inline mr-2"
      >
        <a @click="expandClick(node, !node.isExpanded)">
          <vs-icon :icon="expandIcon" icon-pack="fas" color="primary"></vs-icon>
        </a>
      </vx-tooltip>

      <a v-if="node.canZoom" @click="zoomClick(node.data)" class="mr-2">
        <vs-icon
          icon="fa-search-plus"
          icon-pack="fas"
          color="primary"
        ></vs-icon>
      </a>

      <vx-tooltip
        v-if="node.canHide"
        :text="userControlTooltip.canHide"
        class="inline mr-2"
      >
        <a @click="hideClick(node, !node.isHidden)">
          <vs-icon
            icon="fa-eye-slash"
            icon-pack="far"
            color="primary"
          ></vs-icon>
        </a>
      </vx-tooltip>
    </div>

    <vx-tooltip
      v-if="alertCount"
      :text="alertTooltip"
      class="alert-count inline"
    >
      <vs-chip @click="alertClick(node)" color="danger">
        {{ alertCount }}
      </vs-chip>
    </vx-tooltip>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api'
import { TreeWareNetworkNode } from './TreeWareNetworkNode'
import { TreeWareNetworkNodeToolbarTooltip } from './TreeWareNetworkNodeToolbarTypes'
import { useTreeWareNetworkToolbarEmits } from './useTreeWareNetworkToolbarEmits'

const defaultTreeWareNetworkNodeToolbarTooltip: TreeWareNetworkNodeToolbarTooltip = {
  canPin: 'Pin this node',
  canExpand: 'Expand/collapse this node',
  canHide: 'Hide this node',
  canZoom: 'Zoom this node'
}

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<TreeWareNetworkNode>,
      required: true
    },
    userControlTooltip: {
      type: Object as PropType<TreeWareNetworkNodeToolbarTooltip>,
      default: () => defaultTreeWareNetworkNodeToolbarTooltip
    },
    pinnedPinColor: { type: String, default: 'dark' },
    alertCount: { type: Number, default: 0 },
    alertTooltip: { type: String, default: '' }
  },
  setup(props, { emit }) {
    const expandIcon = computed(() =>
      props.node.isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'
    )
    return {
      expandIcon,
      ...useTreeWareNetworkToolbarEmits(emit, 'TreeWareNetworkNodeToolbar')
    }
  }
})
</script>

<style lang="scss" scoped>
.tree-ware-network-node-toolbar {
  margin-bottom: 1rem;

  .toolbar {
    a {
      align-items: center;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 2rem;
      width: 2rem;
    }
  }

  .pin {
    transform: rotate(45deg);

    &.is-pinned {
      transform: rotate(0deg);
    }
  }

  .alert-count {
    position: absolute;
    right: -1.1rem;
    top: -1rem;
  }
}
</style>
