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
        :is-selectable="allowSelectionForLinkTypes.includes(link.link.linkType)"
        :column-gap="columnGap"
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
        @update:node="updateNode"
        @zoom:node="zoomNode"
        @error:node="$emit('error:node', $event)"
        :class="nodeColumn.class"
      />
    </div>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import { partition } from '../utilities/array'
import { ObjectSet } from '../utilities/ObjectSet'
import { isNotUndefined } from '../utilities/predicates'
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
import { getPinnedGraph } from './TreeWareNetworkGraphPinned'
import {
  LinkDirection,
  LINK_TYPE_GROUPED,
  NodeType
} from './TreeWareNetworkGraphTypes'
import TreeWareNetworkLink from './TreeWareNetworkLink.vue'
import TreeWareNetworkNodeColumn from './TreeWareNetworkNodeColumn.vue'

type SimNodeMap<N> = { [nodeId: string]: SimNode<N> }

interface NodeColumn<N> {
  nodes: SimNode<N>[]
  class: string
}

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

  @Emit('update:node')
  private updateNode(newNode: Node<N>) {}

  @Emit('zoom:node')
  private zoomNode(node: Node<N>) {}

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
    window.addEventListener('animationend', this.redrawLinks)
    window.addEventListener('transitionend', this.redrawLinks)

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
    window.removeEventListener('animationend', this.redrawLinks)
    window.removeEventListener('transitionend', this.redrawLinks)
  }

  private redrawLinks() {
    this.updateColumnGap()
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
          nodes: this.pinnedAndGroupedSimGraph.nodes.filter(
            this.filterNodeByDirection
          ),
          links: this.pinnedAndGroupedSimGraph.links.filter(
            this.filterLinkByDirection
          )
        }
      : this.pinnedAndGroupedSimGraph
  }

  private get nodeCounts(): NodeCounts {
    const nodeCounts: NodeCounts = {
      ingress: 0,
      internal: 0,
      egress: 0
    }
    this.pinnedAndGroupedSimGraph.nodes.forEach(simNode => {
      if (simNode.nodeType & NodeType.INTERNAL) ++nodeCounts.internal
      else if (simNode.nodeType & NodeType.INGRESS) ++nodeCounts.ingress
      else if (simNode.nodeType & NodeType.EGRESS) ++nodeCounts.egress
    })
    return nodeCounts
  }

  private get pinnedAndGroupedSimGraph(): SimGraph<N, L> {
    // Drop children of collapsed group-nodes.
    const nodes = this.pinnedSimGraph.nodes.filter(
      node => !isInCollapsedGroup(node)
    )

    // Drop links of expanded group nodes and children of collapsed group-nodes.
    const [parentLinks, droppedChildLinks] = partition(
      this.pinnedSimGraph.links,
      link =>
        !isExpandedGroupOrInCollapsedGroup(link.source) &&
        !isExpandedGroupOrInCollapsedGroup(link.target)
    )

    // Clear children lists so that only filtered children can be added below.
    nodes.forEach(node => {
      if (node.children) node.children = []
    })

    // Add dropped child nodes to their collapsed parent node. The parent
    // node will show these children in a list. Note that these children are
    // those that made it thru the pinned filters.
    droppedChildLinks.forEach(link => {
      addChildToParent(link.source)
      addChildToParent(link.target)
    })

    nodes.sort((a: SimNode<N>, b: SimNode<N>) =>
      this.config.node.compare(a.node, b.node)
    )
    // Sort children in collapsed groups.
    nodes.forEach(simNode =>
      simNode.children?.sort((a: SimNode<N>, b: SimNode<N>) =>
        this.config.node.compare(a.node, b.node)
      )
    )

    return { nodes, links: parentLinks }
  }

  private get pinnedSimGraph(): SimGraph<N, L> {
    return getPinnedGraph(this.groupedLinksSimGraph)
  }

  private get groupedLinksSimGraph(): SimGraph<N, L> {
    // Create group links.
    const groupLinksSet = new ObjectSet<SimLink<N, L>>(link => link.id)
    this.inputSimGraph.links
      .map(createGroupLink)
      .filter(isNotUndefined)
      .forEach(link => groupLinksSet.add(link))
    const groupLinks = groupLinksSet.values()

    return {
      nodes: this.inputSimGraph.nodes,
      links: [...this.inputSimGraph.links, ...groupLinks]
    }
  }

  private get inputSimGraph(): SimGraph<N, L> {
    // Create SimNode instances for all Node instances in the graph.
    const allNodes = new ObjectSet<SimNode<N>>(simNode => simNode.node.id)
    this.graph.nodes.forEach(node => {
      const simNode = nodeToSimNode(node)
      allNodes.add(simNode)
      node.group?.children.forEach(child => {
        const childSimNode = allNodes.get(child.id) ?? nodeToSimNode(child)
        childSimNode.parent = simNode
        simNode.allChildren?.push(childSimNode)
        allNodes.add(childSimNode)
      })
    })

    // Drop hidden nodes.
    const nodes = allNodes
      .values()
      .filter(node => !node.node.isHidden && !node.parent?.node.isHidden)
    const simNodeMap: SimNodeMap<N> = {}
    nodes.forEach(simNode => {
      simNodeMap[simNode.node.id] = simNode
    })

    const links: SimLink<N, L>[] = this.graph.links
      .map(link => linkToSimLink(simNodeMap, link))
      .filter(isNotUndefined)

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

  private get linkTypes(): Set<string> {
    return new Set<string>(this.graph.links.map(link => link.linkType))
  }

  private updateColumnGap() {
    const column0 = this.nodeColumnsVue[0].$el.getBoundingClientRect()
    const column1 = this.nodeColumnsVue[1].$el.getBoundingClientRect()
    this.columnGap = column1.left - column0.left - column0.width
  }

  private columnGap: number = 100
}

export function isInCollapsedGroup<N>(simNode: SimNode<N>): boolean {
  const parentSimNode = simNode.parent
  if (!parentSimNode) return false // not in a group
  return !parentSimNode.node.group?.isExpanded
}

export function isExpandedGroupOrInCollapsedGroup<N>(
  simNode: SimNode<N>
): boolean {
  return simNode.node.group?.isExpanded || isInCollapsedGroup(simNode)
}

function createGroupLink<N, L>(
  simLink: SimLink<N, L>
): SimLink<N, L> | undefined {
  const sourceGroup = simLink.source.parent
  const targetGroup = simLink.target.parent
  if (sourceGroup) {
    sourceGroup.nodeType = simLink.source.nodeType
    return {
      ...simLink,
      id: getLinkId(sourceGroup, simLink.target, LINK_TYPE_GROUPED),
      source: sourceGroup,
      link: {
        ...simLink.link,
        linkType: LINK_TYPE_GROUPED
      }
    }
  } else if (targetGroup) {
    targetGroup.nodeType = simLink.target.nodeType
    return {
      ...simLink,
      id: getLinkId(simLink.source, targetGroup, LINK_TYPE_GROUPED),
      target: targetGroup,
      link: {
        ...simLink.link,
        linkType: LINK_TYPE_GROUPED
      }
    }
  }
  return undefined
}

function addChildToParent<N>(child: SimNode<N>) {
  const parent = child.parent
  if (parent === null) return
  const children = parent.children
  if (children === null) return
  // TODO(deepak-nulu): use a set in the parent to avoid duplicates.
  if (!children.find(simNode => simNode.node.id === child.node.id)) {
    children.push(child)
  }
}

function addIfNewNode<N>(
  nodeIdSet: Set<string>,
  simNodes: SimNode<N>[],
  simNode: SimNode<N> | undefined
) {
  if (!simNode || nodeIdSet.has(simNode.node.id)) return
  simNodes.push(simNode)
  nodeIdSet.add(simNode.node.id)
}

function nodeToSimNode<N>(node: Node<N>): SimNode<N> {
  // Objects in a list are not reactive. Vue.observable() makes them reactive.
  return Vue.observable({
    node,
    children: node.group === null ? null : [],
    allChildren: node.group === null ? null : [],
    parent: null,
    nodeType: node.isInternal ? NodeType.INTERNAL : NodeType.NONE,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
}

function linkToSimLink<N, L>(
  simNodeMap: SimNodeMap<N>,
  link: Link<L>
): SimLink<N, L> | undefined {
  const source = simNodeMap[link.sourceId]
  if (!source) return undefined
  const target = simNodeMap[link.targetId]
  if (!target) return undefined
  if (!source.node.isInternal) {
    source.nodeType = NodeType.INGRESS
    if (target.node.isInternal) target.nodeType |= NodeType.INGRESS
  }
  if (!target.node.isInternal) {
    target.nodeType = NodeType.EGRESS
    if (source.node.isInternal) source.nodeType |= NodeType.EGRESS
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
    link,
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
  return `${source.node.id}->${target.node.id}:${linkType}`
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
