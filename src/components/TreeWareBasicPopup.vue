<template>
  <div class="tree-ware-basic-popup" v-if="show" @click="clickOuterContent">
    <div class="popup-bg-fill" />
    <div class="content" :style="style" :class="{ fullscreen: fullScreen }">
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
  @Prop({ default: '30%' }) readonly topOffsetInPercentage!: string
  @Prop({ default: 'px' }) readonly lengthUnit!: string
  @Prop({ default: false }) readonly fullScreen!: boolean

  get style() {
    return !this.fullScreen
      ? {
          width: `${this.popupWidth}${this.lengthUnit}`,
          left: `calc(50% - ${this.popupWidth / 2}${this.lengthUnit})`,
          top: `${this.topOffsetInPercentage}`
        }
      : {}
  }

  private clickOuterContent(e: MouseEvent) {
    const targetClass = (e.target as HTMLElement).className
    if (
      targetClass === 'tree-ware-basic-popup' ||
      targetClass === 'popup-bg-fill'
    ) {
      this.$emit('click-outer-content')
    }
  }
}
</script>
<style lang="scss" scoped>
$background-color: rgba(var(--vs-dark), 1);
$border-color: grey;

.tree-ware-basic-popup {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100000;
  .popup-bg-fill {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
  }
  .content {
    position: relative;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 10px;
    border: 1px solid $border-color;
    background-color: $background-color;
    border-radius: 5px;
  }
  .fullscreen {
    width: auto;
    height: 100%;
  }
}
</style>
