<template>
  <div class="tree-ware-button-group flex flex-row">
    <vx-tooltip
      v-for="(button, index) in buttons"
      :key="index"
      :text="button.tooltip"
      :position="tooltipPosition"
      class="button-tooltip"
    >
      <vs-button
        v-if="button.text"
        @click="syncedSelected = index"
        :icon="button.icon"
        :icon-pack="button.iconPack"
        :size="buttonSize"
        :disabled="syncedSelected === index"
      >
        {{ button.text }}
      </vs-button>
      <!-- Need a v-else to prevent empty text from offsetting the icon -->
      <!-- in icon-only mode -->
      <vs-button
        v-else
        @click="syncedSelected = index"
        :icon="button.icon"
        :icon-pack="button.iconPack"
        :size="buttonSize"
        :disabled="syncedSelected === index"
      />
    </vx-tooltip>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'

import { RadioButton } from './TreeWareRadioButtonGroupInterfaces'

@Component
export default class TreeWareButtonGroup extends Vue {
  @Prop() readonly buttons!: RadioButton[]

  @PropSync('selected', { type: Number, default: 0 })
  readonly syncedSelected!: number

  @Prop({ default: 'large' }) readonly buttonSize!: 'small' | 'medium' | 'large'
  @Prop({ default: 'top' }) readonly tooltipPosition!:
    | 'top'
    | 'left'
    | 'bottom'
    | 'right'
}
</script>

<style lang="scss" scoped>
.tree-ware-button-group {
  .button-tooltip:not(:last-child) {
    button {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
  .button-tooltip:not(:first-child) {
    button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
    // Separate buttons in the group by 1 pixel.
    margin-left: 1px;
  }
}
</style>
