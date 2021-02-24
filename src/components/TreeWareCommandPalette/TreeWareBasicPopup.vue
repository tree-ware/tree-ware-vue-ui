<template>
  <div class="palette-popup" v-if="show">
    <div class="bg-dark content">
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
}
</script>
<style lang="scss" scoped>
$content-width: 500px;
.palette-popup {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100000;
  .content {
    top: 30%;
    left: calc(50% - #{$content-width/2});
    width: $content-width;
    position: relative;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 10px;
    border: 1px solid grey;
    border-radius: 5px;
  }
}
</style>
