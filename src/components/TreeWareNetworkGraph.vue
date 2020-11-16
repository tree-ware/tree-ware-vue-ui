<template>
  <div
    ref="graphDiv"
    class="tree-ware-network-graph"
    style="position: relative;"
  >
    <div ref="nodes" style="position: absolute; width: 100%; height: auto;" />
    <svg
      ref="links"
      style="position: absolute; z-index: -1; width: 100%; height: 100%;"
    />
  </div>
</template>

<script lang="ts">
import * as d3 from 'd3'

import 'reflect-metadata'
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'
import {
  Graph,
  Link,
  NetworkGraphConfig,
  Node,
  NodeCounts,
  ShowDirections,
  SimLink,
  SimNode
} from './TreeWareNetworkGraphInterfaces'
import { getPinnedLinks } from './TreeWareNetworkGraphPinned'
import {
  LinkShape,
  NodeType,
  MAX_NODE_TYPE_VALUE,
  LinkDirection
} from './TreeWareNetworkGraphTypes'

const SELF_LINK_Y_OFFSET = 10
const SELF_LINK_SIZE = 100

export type SimNodeMap<N> = { [nodeId: string]: SimNode<N> }

// NOTES:
// The following "pipeline" is set up to render the input `graph`.
// The pipeline stages (functions) are determined based on inputs
// that trigger filtering or re-rendering. The pipeline starts in
// `updateAll()`.
// (1) `graph` property is converted into `inputSimNodes` & `inputSimLinks`.
// (2) `inputSimNodes` and `inputSimLinks` are filtered by pinned nodes to
//     create `pinnedSimNodes` and `pinnedSimLinks`.
// (3) Node-counts are computed from `pinnedSimNodes`.
// (4) `pinnedSimNodes` and `pinnedSimLinks` are filtered by `showDirections`
//     property to create `visibleSimNodes` and `visibleSimLinks`.
// (5) `visibleSimNodes` and `visibleSimLinks` are rendered.

@Component
export default class TreeWareNetworkGraph<N, L> extends Vue {
  @Prop() readonly config!: NetworkGraphConfig<N>
  @Prop() readonly graph!: Graph<N, L>
  @Prop() readonly showDirections?: ShowDirections
  @Prop({ default: false }) readonly redrawOnWindowResize!: boolean

  @Ref() readonly graphDiv!: HTMLDivElement
  @Ref() readonly nodes!: HTMLDivElement
  @Ref() readonly links!: SVGSVGElement

  mounted() {
    if (this.redrawOnWindowResize) {
      window.addEventListener('resize', this.renderVisible)
    }
    this.updateAll()
  }

  beforeDestroy() {
    if (this.redrawOnWindowResize) {
      window.removeEventListener('resize', this.renderVisible)
    }
  }

  @Watch('graph', { deep: true })
  graphChanged(newGraph: Graph<N, L>, oldGraph: Graph<N, L>) {
    this.updateAll()
  }

  @Watch('showDirections', { deep: true })
  showDirectionsChanged(
    newDirections: ShowDirections,
    oldDirections: ShowDirections
  ) {
    this.updateVisible()
  }

  private updateAll() {
    this.populateLinkTypes()
    this.createArrowheadDefinitions()
    ;[this.inputSimNodes, this.inputSimLinks] = toSim(this.graph)
    this.updatePinned()
  }

  private updatePinned() {
    const pinnedIngress = this.findPinned(NodeType.INGRESS)
    const pinnedInternal = this.inputSimNodes.find(
      node => node.isPinned && node.nodeType & NodeType.INTERNAL
    )
    const pinnedEgress = this.findPinned(NodeType.EGRESS)

    // Include links first.
    this.pinnedSimLinks = getPinnedLinks(
      this.inputSimLinks,
      pinnedIngress,
      pinnedInternal,
      pinnedEgress
    )

    // Include all pinned nodes.
    const nodeIdSet = new Set<string>()
    this.pinnedSimNodes = []
    this.addToPinnedNodes(nodeIdSet, pinnedIngress)
    this.addToPinnedNodes(nodeIdSet, pinnedInternal)
    this.addToPinnedNodes(nodeIdSet, pinnedEgress)
    // Include all nodes from the pinned links.
    this.pinnedSimLinks.forEach(link => {
      this.addToPinnedNodes(nodeIdSet, link.source)
      this.addToPinnedNodes(nodeIdSet, link.target)
    })
    this.pinnedSimNodes.sort(this.config.node.compare)

    this.updateNodeCounts()
  }

  private addToPinnedNodes(
    nodeIdSet: Set<string>,
    node: SimNode<N> | undefined
  ) {
    if (!node || nodeIdSet.has(node.id)) return
    this.pinnedSimNodes.push(node)
    nodeIdSet.add(node.id)
  }

  private findPinned(nodeType: NodeType): SimNode<N> | undefined {
    return this.inputSimNodes.find(
      node => node.isPinned && node.nodeType === nodeType
    )
  }

  private updateNodeCounts() {
    const nodeCounts = getNodeCounts(this.pinnedSimNodes)
    this.$emit('node-counts', nodeCounts)
    this.updateVisible()
  }

  private updateVisible() {
    if (this.showDirections) {
      this.visibleSimNodes = this.pinnedSimNodes.filter(
        this.filterNodeByDirection
      )
      this.visibleSimLinks = this.pinnedSimLinks.filter(
        this.filterLinkByDirection
      )
    } else {
      this.visibleSimNodes = this.pinnedSimNodes
      this.visibleSimLinks = this.pinnedSimLinks
    }
    this.renderVisible()
  }

  private filterNodeByDirection(node: SimNode<N>): boolean {
    const showDirections = this.showDirections
    const nodeType = node.nodeType
    if (showDirections?.ingress && nodeType & NodeType.INGRESS) return true
    if (showDirections?.egress && nodeType & NodeType.EGRESS) return true
    if (showDirections?.internal && nodeType & NodeType.INTERNAL) return true
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

  private renderVisible() {
    this.updateNodes()
    this.updateLinks()
    // Increase the height of the graph to fit its contents.
    this.updateGraphHeight()
  }

  private createArrowheadDefinitions() {
    d3.select(this.links)
      .append('defs')
      .selectAll('marker')
      .data(this.linkTypes)
      .enter()
      .append('marker')
      .attr('id', String)
      .attr('viewBox', '0 -3 10 6')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('markerWidth', 15)
      .attr('markerHeight', 9)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L10,0L0,3')
  }

  private updateLinks() {
    const links = d3
      .select(this.links)
      .selectAll<SVGGElement, SimLink<N, L>>('g')
      .data(this.visibleSimLinks, d => d.id)
      .join(
        enter => {
          const linkG = enter
            .append('g')
            .attr('class', d => `${d.linkType} ${d.classes ?? ''}`)
            .style('fill', 'none')
          const linkStart = linkG.append('path').attr('class', 'link-start')
          linkStart.attr('marker-end', d => `url(#${d.linkType})`)
          const linkEnd = linkG.append('path').attr('class', 'link-end')
          return linkG
        },
        update => update,
        exit => exit.remove()
      )
      // updateLinkArc() computes and sets the `d` attribute for two paths
      // that make up a single link. So each() is used for accessing each
      // link group separately, accessing each path in that link group,
      // and passing both paths to updateLinkArc().
      // TODO(deepak-nulu): is there an idiomatic way of doing this in d3?
      .each(
        (
          d: SimLink<N, L>,
          index: number,
          links: SVGGElement[] | ArrayLike<SVGGElement>
        ) => {
          const linkG = d3.select<SVGGElement, SimLink<N, L>>(links[index])
          const linkStart = linkG.select<SVGPathElement>('.link-start')
          const linkEnd = linkG.select<SVGPathElement>('.link-end')
          this.updateLinkArc(d, linkStart, linkEnd)
        }
      )
  }

  private updateNodes() {
    const nodeConfig = this.config.node
    const width = this.graphDiv.clientWidth
    this.updateColumnX(width)
    const nodes = d3
      .select(this.nodes)
      .selectAll<HTMLDivElement, SimNode<N>>('.node')
      .data(this.visibleSimNodes, (node: SimNode<N>) => node.id)
      .join(
        enter =>
          enter
            .append('div')
            .style('position', 'absolute')
            .style('width', `${nodeConfig.width}px`)
            .attr('class', d => `node ${d.classes ?? ''}`),
        update => update,
        exit => exit.remove()
      )
    this.renderNodesContent(nodes)
    this.layoutNodes(nodes)
    return nodes
  }

  private renderNodesContent(
    nodes: d3.Selection<HTMLDivElement, SimNode<N>, HTMLDivElement, unknown>
  ) {
    nodes.each(
      (
        d: SimNode<N>,
        index: number,
        nodeArray: HTMLDivElement[] | ArrayLike<HTMLDivElement>
      ) => {
        const node = nodeArray[index]
        // TODO(deepak-nulu): $destory() the previous Vue component instance
        node.innerHTML = '' // clears existing content
        const content = new this.config.node.content({
          parent: this,
          propsData: { data: d.data, simNode: d }
        })
        // $mount() replaces the element specified as a parameter. We don't
        // want the node element to be replaced, so we mount the component
        // without an element, and then add the component as a child of the
        // node.
        content.$mount()
        content.$on('pin', (isPinned: boolean) => {
          d.isPinned = isPinned
          this.updatePinned()
        })
        node.appendChild(content.$el)
        // Update height in the data to the rendered height of the node.
        d.height = node.clientHeight
      }
    )
  }

  private layoutNodes(
    nodes: d3.Selection<HTMLDivElement, SimNode<N>, HTMLDivElement, unknown>
  ) {
    // An array of y-values for the columns. The 3 internal columns are treated
    // as 1 with respect to the y-axis.
    const y = new Array<number>(3)
    let yIndex = 0
    nodes.each(
      (
        d: SimNode<N>,
        index: number,
        nodeArray: HTMLDivElement[] | ArrayLike<HTMLDivElement>
      ) => {
        const nodeG = nodeArray[index]
        switch (d.nodeType) {
          case NodeType.INGRESS:
            yIndex = 0
            break
          case NodeType.EGRESS:
            yIndex = 2
            break
          default:
            yIndex = 1
        }
        d.x = this.boundedX(d)
        d.y = y[yIndex] ?? 0
        y[yIndex] = d.y + d.height + this.config.node.margin
        nodeG.style.transform = `translate(${d.x}px, ${d.y}px)`
      }
    )
  }

  private updateLinkArc(
    d: SimLink<N, L>,
    linkStart: d3.Selection<SVGPathElement, SimLink<N, L>, null, undefined>,
    linkEnd: d3.Selection<SVGPathElement, SimLink<N, L>, null, undefined>
  ) {
    // Set the source of the link to the middle of the right edge of the node.
    let sourceX = (d.source.x || 0) + this.config.node.width
    let sourceY = (d.source.y || 0) + d.source.height / 2
    // Set the target of the link to the middle of the left edge of the node.
    let targetX = d.target.x || 0
    let targetY = (d.target.y || 0) + d.target.height / 2

    // For internal nodes, the links should be on the right edge if the source
    // is above the target, and on the left edge if the source is below the
    // target.
    if (d.source.isInternal && d.target.isInternal) {
      if (sourceY < targetY) targetX += this.config.node.width
      else sourceX -= this.config.node.width
    }

    const dx = targetX - sourceX
    let midX = (targetX + sourceX) / 2
    let midY = (targetY + sourceY) / 2

    // Render a straight link if the source and target are horizontally spread.
    if (this.config.link.shape === LinkShape.CURVED_IF_NEEDED && dx !== 0) {
      linkStart.attr(
        'd',
        generateLineDefinitionString(sourceX, sourceY, midX, midY)
      )
      linkEnd.attr(
        'd',
        generateLineDefinitionString(midX, midY, targetX, targetY)
      )
      return
    }

    // At this point, the source and target have the same x-coordinates. If
    // their y-coordinates are also the same, then it means the source and
    // target are the same node. So render a self-referential curved link.
    const dy = targetY - sourceY
    if (dy === 0) {
      linkStart.attr('d', getSelfReferentialLink(sourceX, sourceY).toString())
      return
    }

    // At this point, the source and target are different nodes in the same
    // column. So render a curved link.

    const dr = Math.sqrt(dx * dx + dy * dy)

    // for len - 30-60-90 triangle rule, trig to calculate mid points
    let len = dr - (dr / 2) * Math.sqrt(3)

    midX = midX + (dy * len) / dr
    midY = midY + (-dx * len) / dr

    linkStart.attr(
      'd',
      generateArcDefinitionString(sourceX, sourceY, dr, midX, midY)
    )
    linkEnd.attr(
      'd',
      generateArcDefinitionString(midX, midY, dr, targetX, targetY)
    )
  }

  private populateLinkTypes() {
    this.linkTypes = []
    this.graph.links.forEach(it => {
      if (!this.linkTypes.includes(it.linkType)) {
        this.linkTypes.push(it.linkType)
      }
    })
  }

  private updateGraphHeight() {
    const nodesHeight = this.nodes.scrollHeight
    const linksBBox = this.links.getBBox()
    const linksHeight = linksBBox.y + linksBBox.height
    const graphHeight = Math.max(nodesHeight, linksHeight)
    this.graphDiv.style.height = `${graphHeight}px`
  }

  private updateColumnX(width: number) {
    // 3 columns for internal nodes did not work out as expected. So using only
    // 1 column for internal nodes.
    const columnCount = 3
    const nodeWidth = this.config.node.width
    const gap = (width - nodeWidth * columnCount) / (columnCount - 1)

    this.columnX[NodeType.INGRESS] = 0

    // All ingress nodes in the same column
    let nextColumn = nodeWidth + gap
    this.columnX[NodeType.INTERNAL | NodeType.INGRESS] = nextColumn
    this.columnX[
      NodeType.INTERNAL | NodeType.INGRESS | NodeType.EGRESS
    ] = nextColumn
    this.columnX[NodeType.INTERNAL] = nextColumn
    this.columnX[NodeType.INTERNAL | NodeType.EGRESS] = nextColumn

    nextColumn += nodeWidth + gap
    this.columnX[NodeType.EGRESS] = nextColumn
  }

  /** Determines x-value based on node-type */
  private boundedX(node: SimNode<N>): number {
    return this.columnX[node.nodeType]
  }

  private visibleGraph: Graph<N, L> = {
    nodes: [],
    links: []
  }

  /** x-values for the nodes in each column */
  private columnX = new Array<number>(MAX_NODE_TYPE_VALUE).fill(0)

  private inputSimNodes: SimNode<N>[] = []
  private inputSimLinks: SimLink<N, L>[] = []

  private pinnedSimNodes: SimNode<N>[] = []
  private pinnedSimLinks: SimLink<N, L>[] = []

  private visibleSimNodes: SimNode<N>[] = []
  private visibleSimLinks: SimLink<N, L>[] = []

  private linkTypes: string[] = []
}

/** Returns 0 if node y-value is negative, else return node y-value */
function boundedY<N>(node: SimNode<N>): number {
  return Math.max(node.y || 0, 0)
}

function toSim<N, L>(graph: Graph<N, L>): [SimNode<N>[], SimLink<N, L>[]] {
  const simNodes: SimNode<N>[] = graph.nodes.map(node => ({
    ...node,
    nodeType: node.isInternal ? NodeType.INTERNAL : NodeType.NONE,
    height: 0,
    isPinned: false
  }))
  const simNodeMap: SimNodeMap<N> = {}
  simNodes.forEach(node => {
    simNodeMap[node.id] = node
  })
  const simLinks: SimLink<N, L>[] = graph.links.map(link => {
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
    return {
      ...link,
      id: getLinkId(source, target, link.linkType),
      direction,
      source,
      target
    }
  })
  return [simNodes, simLinks]
}

function getNodeCounts<N>(simNodes: SimNode<N>[]): NodeCounts {
  const nodeCounts: NodeCounts = {
    ingress: 0,
    internal: 0,
    egress: 0
  }
  simNodes.forEach(simNode => {
    if (simNode.nodeType & NodeType.INTERNAL) ++nodeCounts.internal
    else if (simNode.nodeType & NodeType.INGRESS) ++nodeCounts.ingress
    else if (simNode.nodeType & NodeType.EGRESS) ++nodeCounts.egress
  })
  return nodeCounts
}

function getLinkId<N>(
  source: SimNode<N>,
  target: SimNode<N>,
  linkType: string
): string {
  return `${source.id}->${target.id}:${linkType}`
}

function generateLineDefinitionString(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: Number
): string {
  return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY
}

function generateArcDefinitionString(
  sourceX: number,
  sourceY: number,
  radius: number,
  targetX: number,
  targetY: Number
): string {
  return (
    'M' +
    sourceX +
    ',' +
    sourceY +
    'A' +
    radius +
    ',' +
    radius +
    ' 0 0,1 ' +
    targetX +
    ',' +
    targetY
  )
}

function getSelfReferentialLink(x: number, y: number): d3.Path {
  // Separate the source and target of the link a bit.
  const sourceX = x
  const sourceY = y + SELF_LINK_Y_OFFSET
  const targetX = x
  const targetY = y - SELF_LINK_Y_OFFSET

  // The self-referential curved link is implemented as a bezier path with
  // the following 2 control points. Control point 1 is to the left and
  // below the source point. Control point 2 is to the left and above the
  // source point.
  const control1X = sourceX - SELF_LINK_SIZE
  const control1Y = sourceY + SELF_LINK_SIZE
  const control2X = targetX - SELF_LINK_SIZE
  const control2Y = targetY - SELF_LINK_SIZE

  const path = d3.path()
  path.moveTo(sourceX, sourceY)
  path.bezierCurveTo(
    control1X,
    control1Y,
    control2X,
    control2Y,
    targetX,
    targetY
  )
  return path
}
</script>
