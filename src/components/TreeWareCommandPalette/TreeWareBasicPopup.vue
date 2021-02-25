<template>
  <div class="palette-popup" v-if="show" @click="clickOuterContent">
    <div
      class="bg-dark content"
      :style="style"
      :class="{ fullscreen: fullScreen }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class TreeWareBasicPopup extends Vue {
  @Prop({ default: false }) readonly show!: boolean
  @Prop({ default: 500 }) readonly popupWidth!: number
  @Prop({ default: '30%' }) readonly topOffSetInPercentage!: string
  @Prop({ default: 'px' }) readonly lengthUnit!: string
  @Prop({ default: false }) readonly fullScreen!: boolean

  get style() {
    return !this.fullScreen
      ? {
          width: `${this.popupWidth}${this.lengthUnit}`,
          left: `calc(50% - ${this.popupWidth / 2}${this.lengthUnit})`,
          top: `${this.topOffSetInPercentage}`
        }
      : {}
  }

  private clickOuterContent(e: MouseEvent) {
    if ((e.target as HTMLElement).className === 'palette-popup') {
      this.$emit('click-outer-content')
    }
  }
}
</script>
<style lang="scss" scoped>
.palette-popup {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100000;
  .content {
    position: relative;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 10px;
    border: 1px solid grey;
    border-radius: 5px;
  }
  .fullscreen {
    width: auto;
    height: 100%;
  }
}
</style>
