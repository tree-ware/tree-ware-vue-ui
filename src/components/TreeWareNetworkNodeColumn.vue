<template>
  <div class="tree-ware-network-node-column">
    <tree-ware-network-node
      v-for="node in nodes"
      ref="vueNodes"
      :key="node.node.id"
      :node="node"
      :content="nodeConfig.content"
      :nodes-element="nodesElement"
      @update:node="nodeUpdated"
      class="node"
    />
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Emit, Prop, Ref, Vue } from 'vue-property-decorator'
import {
  NetworkGraphNodeConfig,
  Node,
  SimNode
} from './TreeWareNetworkGraphInterfaces'
import TreeWareNetworkNode from './TreeWareNetworkNode.vue'

@Component({
  components: {
    TreeWareNetworkNode
  }
})
export default class TreeWareNetworkNodeColumn<N> extends Vue {
  @Prop() readonly nodeConfig!: NetworkGraphNodeConfig<N>
  @Prop() readonly nodes!: SimNode<N>[]
  @Prop() readonly nodesElement!: Element

  @Emit('update:node')
  private nodeUpdated(newNode: Node<N>) {}

  @Ref() readonly vueNodes!: TreeWareNetworkNode<N>[]

  updated() {
    this.updateSimNodeDomAttributes()
  }

  updateSimNodeDomAttributes(nodesElement?: Element) {
    this.vueNodes?.forEach(vueNode => {
      vueNode.updateSimNodeDomAttributes(this.nodesElement || nodesElement)
    })
  }
}
</script>

<style lang="scss" scoped>
.tree-ware-network-node-column {
  width: 180px;

  .node {
    width: 180px;
    margin-top: 30px;

    &:first-child {
      margin-top: 0px;
    }
  }
}
</style>
