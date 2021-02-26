<template>
  <div class="tree-ware-network-test-node">
    <div class="mb-4">{{ node.data.name }}</div>
    <div>offsetLeft: {{ offsetLeft }}</div>
    <div>offsetTop: {{ offsetTop }}</div>
    <div>offsetWidth: {{ offsetWidth }}</div>
    <div>offsetHeight: {{ offsetHeight }}</div>
  </div>
</template>

<script lang="ts">
import { TreeWareNetworkNode } from '@/tree-ware-vue-ui/src/components/network-graph/TreeWareNetworkNode'
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TreeWareNetworkTestNode extends Vue {
  @Prop() readonly node!: TreeWareNetworkNode

  mounted() {
    window.addEventListener('resize', this.updateOffsets)
    this.$nextTick(() => {
      this.updateOffsets()
    })
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.updateOffsets)
  }

  private updateOffsets() {
    const element = this.$el as HTMLElement
    this.offsetLeft = element.offsetLeft
    this.offsetTop = element.offsetTop
    this.offsetWidth = element.offsetWidth
    this.offsetHeight = element.offsetHeight
  }

  private offsetLeft: number = 0
  private offsetTop: number = 0
  private offsetWidth: number = 0
  private offsetHeight: number = 0
}
</script>
