<template>
  <div class="tree-ware-network-graph">
    <svg class="links">
      <defs>
        <marker
          v-for="linkType in linkTypes"
          :key="linkType"
          :id="linkType"
          viewBox="0 -3 10 6"
          refX="10"
          refY="0"
          markerUnits="userSpaceOnUse"
          markerWidth="15"
          markerHeight="9"
          orient="auto"
        >
          <path d="M0,-3L10,0L0,3"></path>
        </marker>
      </defs>

      <tree-ware-network-link
        v-for="link in visibleSimGraph.links"
        :key="link.id"
        :link="link"
        :link-shape="config.link.shape"
        :is-selectable="allowSelectionForLinkTypes.includes(link.linkType)"
        @select="$emit('select', $event)"
        @unselect="$emit('unselect', $event)"
      />
    </svg>

    <div ref="nodesDiv" class="nodes">
      <tree-ware-network-node-column
        v-for="(nodeColumn, index) in nodeColumns"
        ref="nodeColumnsVue"
        :key="index"
        :node-config="config.node"
        :nodes="nodeColumn.nodes"
        :nodes-element="nodesDiv"
        @pin="pinNode(index, $event)"
        @unpin="unpinNode(index, $event)"
        :class="nodeColumn.class"
      />
    </div>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import {
  Graph,
  Link,
  NetworkGraphConfig,
  Node,
  NodeCounts,
  ShowDirections,
  SimGraph,
  SimLink,
  SimNode
} from './TreeWareNetworkGraphInterfaces'
import { getPinnedLinks } from './TreeWareNetworkGraphPinned'
import { LinkDirection, NodeType } from './TreeWareNetworkGraphTypes'
import TreeWareNetworkLink from './TreeWareNetworkLink.vue'
import TreeWareNetworkNodeColumn from './TreeWareNetworkNodeColumn.vue'
import { ObjectSet } from '../utilities/ObjectSet'
import { isNotUndefined } from '../utilities/predicates'

type SimNodeMap<N> = { [nodeId: string]: SimNode<N> }

interface NodeColumn<N> {
  nodes: SimNode<N>[]
  class: string
}

const INGRESS_COLUMN_INDEX = 0
const INTERNAL_COLUMN_INDEX = 1
const EGRESS_COLUMN_INDEX = 2

@Component({
  components: {
    TreeWareNetworkLink,
    TreeWareNetworkNodeColumn
  }
})
export default class TreeWareNetworkGraph<N, L> extends Vue {
  @Prop() readonly config!: NetworkGraphConfig<N>
  @Prop() readonly graph!: Graph<N, L>
  @Prop() readonly showDirections?: ShowDirections
  @Prop({ default: false }) readonly redrawOnWindowResize!: boolean
  @Prop({ default: () => [] }) allowSelectionForLinkTypes!: string[]

  @Ref() readonly nodesDiv!: HTMLDivElement
  @Ref() readonly nodeColumnsVue!: TreeWareNetworkNodeColumn<N>[]

  @Watch('nodeCounts', { deep: true })
  private nodeCountsChanged(newNodeCounts: NodeCounts) {
    this.$emit('node-counts', newNodeCounts)
  }

  mounted() {
    if (this.redrawOnWindowResize) {
      window.addEventListener('resize', this.redrawLinks)
    }

    // We are using $nextTick() since we need the DOM positions of the nodes.
    //
    // We need to pass `nodesDiv` element to the TreeWareNetworkNode instances,
    // but `$refs` are only populated after the component has been renedered,
    // they are not reactive, and should not be referred to in templates. So
    // we cannot pass `nodesDiv` via the template to the TreeWareNetworkNode
    // instances the first time the graph is rendered. So we pass `nodesDiv`
    // in the function call below for the first-time case.
    this.$nextTick(() => {
      this.updateSimNodeDomAttributes(this.nodesDiv)
    })
  }

  beforeDestroy() {
    if (this.redrawOnWindowResize) {
      window.removeEventListener('resize', this.redrawLinks)
    }
  }

  private redrawLinks() {
    this.updateSimNodeDomAttributes(this.nodesDiv)
  }

  private updateSimNodeDomAttributes(nodesElement?: Element) {
    this.nodeColumnsVue?.forEach(vueNodeColumn => {
      vueNodeColumn.updateSimNodeDomAttributes(nodesElement)
    })
  }

  private get nodeColumns(): NodeColumn<N>[] {
    return [
      { nodes: this.visibleIngressNodes, class: 'ingress' },
      { nodes: this.visibleInternalNodes, class: 'internal' },
      { nodes: this.visibleEgressNodes, class: 'egress' }
    ]
  }

  private get visibleIngressNodes(): SimNode<N>[] {
    return this.visibleSimGraph.nodes.filter(
      node => node.nodeType === NodeType.INGRESS
    )
  }

  private get visibleInternalNodes(): SimNode<N>[] {
    return this.visibleSimGraph.nodes.filter(
      node => node.nodeType & NodeType.INTERNAL
    )
  }

  private get visibleEgressNodes(): SimNode<N>[] {
    return this.visibleSimGraph.nodes.filter(
      node => node.nodeType === NodeType.EGRESS
    )
  }

  get visibleSimGraph(): SimGraph<N, L> {
    return this.showDirections
      ? {
          nodes: this.pinnedSimGraph.nodes.filter(this.filterNodeByDirection),
          links: this.pinnedSimGraph.links.filter(this.filterLinkByDirection)
        }
      : this.pinnedSimGraph
  }

  private get nodeCounts(): NodeCounts {
    const nodeCounts: NodeCounts = {
      ingress: 0,
      internal: 0,
      egress: 0
    }
    this.pinnedSimGraph.nodes.forEach(simNode => {
      if (simNode.nodeType & NodeType.INTERNAL) ++nodeCounts.internal
      else if (simNode.nodeType & NodeType.INGRESS) ++nodeCounts.ingress
      else if (simNode.nodeType & NodeType.EGRESS) ++nodeCounts.egress
    })
    return nodeCounts
  }

  private get pinnedSimGraph(): SimGraph<N, L> {
    // Compute links first since they determine nodes to include
    const links: SimLink<N, L>[] = getPinnedLinks(
      this.groupedLinksSimGraph.links,
      this.pinnedIngress,
      this.pinnedInternal,
      this.pinnedEgress
    )

    let nodes: SimNode<N>[] = []
    // Include all input nodes if there are no pinned nodes.
    if (!this.pinnedIngress && !this.pinnedInternal && !this.pinnedEgress) {
      nodes = [...this.groupedLinksSimGraph.nodes]
    } else {
      // Include all pinned nodes.
      const nodeIdSet = new Set<string>()
      addIfNewNode(nodeIdSet, nodes, this.pinnedIngress)
      addIfNewNode(nodeIdSet, nodes, this.pinnedInternal)
      addIfNewNode(nodeIdSet, nodes, this.pinnedEgress)

      // Include all nodes from the pinned links.
      links.forEach(link => {
        addIfNewNode(nodeIdSet, nodes, link.source)
        addIfNewNode(nodeIdSet, nodes, link.target)
      })
    }
    nodes.sort(this.config.node.compare)

    return { nodes, links }
  }

  private get groupedLinksSimGraph(): SimGraph<N, L> {
    // Create group links.
    const groupLinksSet = new ObjectSet<SimLink<N, L>>(link => link.id)
    this.inputSimGraph.links
      .map(createGroupLink)
      .filter(isNotUndefined)
      .forEach(link => groupLinksSet.add(link))
    const groupLinks = groupLinksSet.values()

    // Drop children of collapsed group-nodes.
    // NOTE: there is no property yet for indicating whether a group-node is
    // expanded or collapsed. It defaults to collapsed.
    const nodes = this.inputSimGraph.nodes.filter(node => node.parent === null)

    // Drop links of children of collapsed group-nodes.
    // NOTE: there is no property yet for indicating whether a group-node is
    // expanded or collapsed. It defaults to collapsed.
    const nonGroupLinks = this.inputSimGraph.links.filter(
      link => link.source.parent === null && link.target.parent === null
    )

    return {
      nodes,
      links: [...nonGroupLinks, ...groupLinks]
    }
  }

  private get inputSimGraph(): SimGraph<N, L> {
    const nodes: SimNode<N>[] = []
    this.graph.nodes.forEach(node => {
      const simNode = nodeToSimNode(node, this.isPinned(node))
      nodes.push(simNode)
      node.children?.forEach(child => {
        const childSimNode = nodeToSimNode(child, this.isPinned(child))
        childSimNode.parent = simNode
        nodes.push(childSimNode)
        simNode.children?.push(childSimNode)
      })
    })

    const simNodeMap: SimNodeMap<N> = {}
    nodes.forEach(node => {
      simNodeMap[node.id] = node
    })

    const links: SimLink<N, L>[] = this.graph.links.map(link =>
      linkToSimLink(simNodeMap, link)
    )

    return { nodes, links }
  }

  private filterNodeByDirection(node: SimNode<N>): boolean {
    const showDirections = this.showDirections
    const nodeType = node.nodeType
    if (showDirections?.ingress && nodeType & NodeType.INGRESS) return true
    if (showDirections?.egress && nodeType & NodeType.EGRESS) return true
    if (nodeType & NodeType.INTERNAL) {
      return showDirections?.internal || this.graph.links.length === 0
    }
    return false
  }

  private filterLinkByDirection(link: SimLink<N, L>): boolean {
    switch (link.direction) {
      case LinkDirection.INTERNAL:
        return this.showDirections?.internal ?? false
      case LinkDirection.INGRESS:
        return this.showDirections?.ingress ?? false
      case LinkDirection.EGRESS:
        return this.showDirections?.egress ?? false
    }
  }

  private get pinnedIngress(): SimNode<N> | undefined {
    return this.findPinned(INGRESS_COLUMN_INDEX)
  }

  private get pinnedInternal(): SimNode<N> | undefined {
    return this.findPinned(INTERNAL_COLUMN_INDEX)
  }

  private get pinnedEgress(): SimNode<N> | undefined {
    return this.findPinned(EGRESS_COLUMN_INDEX)
  }

  private findPinned(columnIndex: number): SimNode<N> | undefined {
    const pinnedId = this.pinnedNodeIds[columnIndex]
    if (!pinnedId) return undefined
    return this.inputSimGraph.nodes.find(node => node.id === pinnedId)
  }

  private get linkTypes(): Set<string> {
    return new Set<string>(this.graph.links.map(link => link.linkType))
  }

  private pinNode(columnIndex: number, node: SimNode<N>) {
    const oldPinnedNode = this.findPinned(columnIndex)
    if (oldPinnedNode) oldPinnedNode.isPinned = false
    node.isPinned = true
    this.pinnedNodeIds.splice(columnIndex, 1, node.id)
  }

  private unpinNode(columnIndex: number, node: SimNode<N>) {
    node.isPinned = false
    this.pinnedNodeIds.splice(columnIndex, 1, undefined)
  }

  private isPinned(node: Node<N>): boolean {
    if (!node.id) return false
    return this.pinnedNodeIds.includes(node.id)
  }

  private pinnedNodeIds: (string | undefined)[] = [
    undefined,
    undefined,
    undefined
  ]
}

function createGroupLink<N, L>(link: SimLink<N, L>): SimLink<N, L> | undefined {
  const sourceGroup = link.source.parent
  const targetGroup = link.target.parent
  if (sourceGroup) {
    sourceGroup.nodeType = link.source.nodeType
    return {
      ...link,
      id: getLinkId(sourceGroup, link.target, link.linkType),
      source: sourceGroup
    }
  } else if (targetGroup) {
    targetGroup.nodeType = link.target.nodeType
    return {
      ...link,
      id: getLinkId(link.source, targetGroup, link.linkType),
      target: targetGroup
    }
  }
  return undefined
}

function addIfNewNode<N>(
  nodeIdSet: Set<string>,
  nodes: SimNode<N>[],
  node: SimNode<N> | undefined
) {
  if (!node || nodeIdSet.has(node.id)) return
  nodes.push(node)
  nodeIdSet.add(node.id)
}

function nodeToSimNode<N>(node: Node<N>, isPinned: boolean): SimNode<N> {
  // Objects in a list are not reactive. Vue.observable() makes them reactive.
  return Vue.observable({
    ...node,
    children: node.children === null ? null : [],
    parent: null,
    nodeType: node.isInternal ? NodeType.INTERNAL : NodeType.NONE,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    isPinned
  })
}

function linkToSimLink<N, L>(
  simNodeMap: SimNodeMap<N>,
  link: Link<L>
): SimLink<N, L> {
  const source = simNodeMap[link.sourceId]
  const target = simNodeMap[link.targetId]
  if (!source.isInternal) {
    source.nodeType = NodeType.INGRESS
    if (target.isInternal) target.nodeType |= NodeType.INGRESS
  }
  if (!target.isInternal) {
    target.nodeType = NodeType.EGRESS
    if (source.isInternal) source.nodeType |= NodeType.EGRESS
  }
  const direction =
    source.nodeType === NodeType.INGRESS
      ? LinkDirection.INGRESS
      : target.nodeType === NodeType.EGRESS
      ? LinkDirection.EGRESS
      : LinkDirection.INTERNAL
  // TODO(deepak-nulu): handle the case where an external node is both ingress and egress.
  // Objects in a list are not reactive. Vue.observable() makes them reactive.
  return Vue.observable({
    ...link,
    id: getLinkId(source, target, link.linkType),
    direction,
    source,
    target
  })
}

function getLinkId<N>(
  source: SimNode<N>,
  target: SimNode<N>,
  linkType: string
): string {
  return `${source.id}->${target.id}:${linkType}`
}
</script>

<style lang="scss" scoped>
.tree-ware-network-graph {
  position: relative;
  display: flex;
  height: auto;

  .links {
    position: absolute;
    height: 100%;
    width: 100%;
  }

  .nodes {
    background: transparent;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: auto;
  }
}
</style>
