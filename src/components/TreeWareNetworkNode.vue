<template>
  <div>
    <component :is="content" :node="node" @pin="node.isPinned = $event" />
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { VueConstructor } from 'vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { SimNode } from './TreeWareNetworkGraphInterfaces'

@Component
export default class TreeWareNetworkNode<N> extends Vue {
  @Prop() readonly node!: SimNode<N>
  @Prop({ type: Function }) readonly content!: VueConstructor
  @Prop() readonly nodesElement!: Element

  // A component's `updated()` method is only called when the contents of the
  // component is changed. When the position of a component is changed (due
  // to filtering for example), its `updated()` method is not called. Instead,
  // its parent's `updated()` method is called (since it is a change for the
  // parent's content).
  // Also, if a node's content changes, its `updated()` method as well as its
  // parent's `updated()` method is called.
  // Therefore this method is only called by the parent's `updated()` method.
  updateSimNodeDomAttributes() {
    const nodesRect = this.nodesElement.getBoundingClientRect()
    const nodeRect = this.$el.getBoundingClientRect()
    this.node.x = nodeRect.left - nodesRect.left
    this.node.y = nodeRect.top - nodesRect.top
    this.node.width = nodeRect.width
    this.node.height = nodeRect.height
  }
}
</script>
