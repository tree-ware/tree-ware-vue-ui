<template>
  <div :class="nodeClasses">
    <component
      :is="content"
      :node="node.node"
      @update:node="updateNode"
      @zoom:node="zoomNode"
    />
    <template v-if="isGroup">
      <div class="group-title">
        <span v-if="!node.node.isExpanded">{{ node.children.length }}</span>
        {{ node.node.group.name }}
      </div>
      <VuePerfectScrollbar v-if="showChildren" class="group-members">
        <component
          v-for="child in node.children"
          :key="child.node.id"
          :is="content"
          :node="child.node"
          :collapsed-group-member="true"
        />
      </VuePerfectScrollbar>
    </template>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { VueConstructor } from 'vue'
import VuePerfectScrollbar from 'vue-perfect-scrollbar'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'
import { Node, SimNode } from './TreeWareNetworkGraphInterfaces'
import { CollapsedGroupChildrenMode } from './TreeWareNetworkGraphTypes'

@Component({
  components: {
    VuePerfectScrollbar
  }
})
export default class TreeWareNetworkNode<N> extends Vue {
  @Prop() readonly node!: SimNode<N>
  @Prop({ type: Function }) readonly content!: VueConstructor
  @Prop() readonly nodesElement!: Element

  @Emit('update:node')
  private updateNode(newNode: Node<N>) {}

  @Emit('zoom:node')
  private zoomNode(node: Node<N>) {}

  // A component's `updated()` method is only called when the contents of the
  // component is changed. When the position of a component is changed (due
  // to filtering for example), its `updated()` method is not called. Instead,
  // its parent's `updated()` method is called (since it is a change for the
  // parent's content).
  // Also, if a node's content changes, its `updated()` method as well as its
  // parent's `updated()` method is called.
  // Therefore this method is only called by the parent's `updated()` method.
  updateSimNodeDomAttributes(nodesElement?: Element) {
    const definedNodesElement = this.nodesElement || nodesElement
    const nodesRect = definedNodesElement.getBoundingClientRect()
    const nodeRect = this.$el.getBoundingClientRect()
    this.node.x = nodeRect.left - nodesRect.left
    this.node.y = nodeRect.top - nodesRect.top
    this.node.width = nodeRect.width
    this.node.height = nodeRect.height
  }

  private get nodeClasses(): {}[] {
    return [
      'tree-ware-network-node',
      ...this.node.node.classes,
      {
        highlighted: this.node.node.wasPinned
      }
    ]
  }

  private get isGroup(): boolean {
    const childCount = this.node.node.group?.children.length ?? 0
    return childCount > 0
  }

  private get showChildren(): boolean {
    return (
      this.node.node.group?.childrenMode !==
        CollapsedGroupChildrenMode.HIDE_CHILDREN && !this.node.node.isExpanded
    )
  }
}
</script>

<style lang="scss" scoped>
.tree-ware-network-node {
  position: relative;

  .group-title {
    border-top: solid 1px;
    margin-bottom: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .group-members {
    max-height: 92px;
  }
}
</style>
