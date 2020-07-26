<template>
  <vs-button
    @click="toggle()"
    icon-pack="fas"
    :icon="getIcon()"
    :color="getColor()"
    size="large"
  />
</template>

<script lang="ts">
import 'reflect-metadata'
import {
  Component,
  Emit,
  Prop,
  PropSync,
  Vue,
  Watch
} from 'vue-property-decorator'

@Component
export default class TreeWarePlayPauseButton extends Vue {
  @Prop({ default: 5 }) readonly tickIntervalSeconds!: number
  @PropSync('play', { type: Boolean }) syncedPlay!: Boolean

  @Emit() tick() {}

  @Watch('syncedPlay')
  playChanged(newPlay: Boolean, oldPlay: Boolean) {
    if (newPlay) this.startTimer()
    else this.clearTimer()
  }

  private startTimer() {
    this.clearTimer()
    this.timerId = setInterval(this.tick, this.tickIntervalSeconds * 1000)
  }

  private clearTimer() {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId)
      this.timerId = undefined
    }
  }

  private toggle() {
    this.syncedPlay = !this.syncedPlay
  }

  private getIcon(): string {
    return this.syncedPlay ? 'fa-pause' : 'fa-play'
  }

  private getColor(): string {
    return this.syncedPlay ? 'warning' : 'primary'
  }

  private timerId?: number
}
</script>
