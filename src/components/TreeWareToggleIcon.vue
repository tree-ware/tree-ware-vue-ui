<template>
  <vx-tooltip :text="tooltip">
    <a @click="toggle()" class="flex flex-row">
      <vs-icon :icon="icon" :icon-pack="iconPack"></vs-icon>
    </a>
  </vx-tooltip>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'

@Component
export default class TreeWareToggleIcon extends Vue {
  @PropSync('on', { type: Boolean }) syncedOn!: boolean

  @Prop() readonly iconOn!: string
  @Prop() readonly iconOff!: string
  @Prop() readonly iconPack?: string

  @Prop({ default: 'On. Click to turn off.' }) readonly tooltipOn!: string
  @Prop({ default: 'Off. Click to turn on.' }) readonly tooltipOff!: string

  get icon(): string {
    return this.syncedOn ? this.iconOn : this.iconOff
  }

  get tooltip(): string {
    return this.syncedOn ? this.tooltipOn : this.tooltipOff
  }

  toggle(): void {
    this.syncedOn = !this.syncedOn
  }
}
</script>
