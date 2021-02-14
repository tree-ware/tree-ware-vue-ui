<template>
  <div class="tree-ware-network-node-toolbar">
    <div v-if="config" class="flex flex-row mb-2">
      <div class="toolbar">
        <vx-tooltip
          v-if="config.pin"
          :text="config.pin.tooltip"
          :class="['pin', { 'is-pinned': isPinned }, 'mr-2']"
        >
          <a @click="config.pin.onClick">
            <vs-icon
              icon="fa-thumbtack"
              icon-pack="fas"
              :color="isPinned ? config.pinnedPinColor : 'primary'"
            ></vs-icon>
          </a>
        </vx-tooltip>

        <vx-tooltip
          v-if="config.expand"
          :text="expandTooltip"
          class="inline mr-2"
        >
          <a @click="config.expand.onClick">
            <vs-icon
              :icon="expandIcon"
              icon-pack="fas"
              color="primary"
            ></vs-icon>
          </a>
        </vx-tooltip>

        <!-- <vx-tooltip v-if="config.zoom" :text="config.zoom.tooltip" class="inline mr-2"> -->
        <a v-if="config.zoom" @click="config.zoom.onClick" class="mr-2">
          <vs-icon
            icon="fa-search-plus"
            icon-pack="fas"
            color="primary"
          ></vs-icon>
        </a>
        <!-- </vx-tooltip> -->

        <vx-tooltip v-if="config.log" :text="config.log.tooltip" class="mr-2">
          <a @click="config.log.onClick">
            <vs-icon
              icon="fa-terminal"
              icon-pack="fas"
              color="primary"
            ></vs-icon>
          </a>
        </vx-tooltip>
      </div>
    </div>

    <vx-tooltip
      v-if="alertCount"
      :text="config.alertCount.tooltip"
      class="alert-count inline"
    >
      <vs-chip @click="config.alertCount.onClick" color="danger">
        {{ alertCount }}
      </vs-chip>
    </vx-tooltip>

    <slot class="m-1" />
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { TreeWareNetworkNodeToolbarConfig } from './TreeWareNetworkNodeToolbarInterfaces'

// TODO(deepak-nulu): show tooltip for zoom icon. currently commented out
// because tooltip does not get removed sometimes when the click navigates
// to a different page.

@Component
export default class TreeWareNetworkNodeToolbar extends Vue {
  @Prop({ default: () => {} })
  readonly config!: TreeWareNetworkNodeToolbarConfig
  @Prop({ default: false }) readonly isPinned!: boolean
  @Prop({ default: false }) readonly isExpanded!: boolean
  @Prop({ default: 0 }) readonly alertCount!: number

  private get expandTooltip(): string {
    return this.isExpanded ? 'Collapse this group' : 'Expand this group'
  }

  private get expandIcon(): string {
    return this.isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'
  }
}
</script>

<style lang="scss" scoped>
.tree-ware-network-node-toolbar {
  .toolbar {
    display: flex;

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

  ::v-deep {
    .section-title {
      font-weight: bold;
      margin-top: 1rem;
    }
  }
}
</style>
