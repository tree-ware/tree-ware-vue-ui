<template>
  <div class="tree-ware-network-node-toolbar">
    <div class="toolbar flex flex-row mb-2">
      <vx-tooltip
        v-if="userControl.canPin"
        :text="userControlTooltip.canPin"
        :class="['pin', { 'is-pinned': userState.isPinned }, 'mr-2']"
      >
        <a @click="pinClick">
          <vs-icon
            icon="fa-thumbtack"
            icon-pack="fas"
            :color="userState.isPinned ? pinnedPinColor : 'primary'"
          ></vs-icon>
        </a>
      </vx-tooltip>

      <vx-tooltip
        v-if="userControl.canExpand"
        :text="userControlTooltip.canExpand"
        class="inline mr-2"
      >
        <a @click="expandClick">
          <vs-icon :icon="expandIcon" icon-pack="fas" color="primary"></vs-icon>
        </a>
      </vx-tooltip>

      <vx-tooltip
        v-if="userControl.canHide"
        :text="userControlTooltip.canHide"
        class="inline mr-2"
      >
        <a @click="hideClick">
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
      <vs-chip @click="alertClick" color="danger">
        {{ alertCount }}
      </vs-chip>
    </vx-tooltip>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'
import {
  TreeWareNetworkNodeUserControl,
  TreeWareNetworkNodeUserState
} from './TreeWareNetworkNode'
import { TreeWareNetworkNodeToolbarTooltip } from './TreeWareNetworkNodeToolbarTypes'

const defaultTreeWareNetworkNodeToolbarTooltip: TreeWareNetworkNodeToolbarTooltip = {
  canPin: 'Pin this node',
  canExpand: 'Expand this node',
  canHide: 'Hide this node'
}

@Component
export default class TreeWareNetworkNodeToolbar extends Vue {
  @Prop() readonly userControl!: TreeWareNetworkNodeUserControl
  @Prop({ default: () => defaultTreeWareNetworkNodeToolbarTooltip })
  readonly userControlTooltip!: TreeWareNetworkNodeToolbarTooltip

  @Prop() readonly userState!: TreeWareNetworkNodeUserState

  @Prop({ default: 'dark' }) readonly pinnedPinColor!: string

  @Prop({ default: 0 }) readonly alertCount!: number
  @Prop({ default: '' }) readonly alertTooltip!: string

  @Emit() private pinClick() {}
  @Emit() private expandClick() {}
  @Emit() private hideClick() {}
  @Emit() private alertClick() {}

  private get expandIcon(): string {
    return this.userState.isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'
  }
}
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
