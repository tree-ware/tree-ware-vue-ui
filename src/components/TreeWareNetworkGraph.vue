<template>
  <svg ref="svg" class="tree-ware-network-graph">
    <g ref="linksG" />
    <g ref="nodesG" />
  </svg>
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
  SimLink,
  SimNode
} from './TreeWareNetworkGraphInterfaces'
import {
  LinkShape,
  NodeType,
  MAX_NODE_TYPE_VALUE
} from './TreeWareNetworkGraphTypes'

const NODE_BORDER_WIDTH = 1
const NODE_PADDING = 10
const NODE_HEIGHT_MINIMUM = 2 * (NODE_BORDER_WIDTH + NODE_PADDING)

const SELF_LINK_SIZE = 100

export type SimNodeMap<N> = { [nodeId: string]: SimNode<N> }

@Component
export default class TreeWareNetworkGraph<N, L> extends Vue {
  @Prop() readonly config!: NetworkGraphConfig<N>
  @Prop() readonly graph!: Graph<N, L>
  @Prop({ default: false }) readonly redrawOnWindowResize!: boolean

  @Ref() readonly svg!: SVGSVGElement
  @Ref() readonly linksG!: SVGGElement
  @Ref() readonly nodesG!: SVGGElement

  @Watch('graph', { deep: true })
  graphChanged(newGraph: Graph<N, L>, oldGraph: Graph<N, L>) {
    const nodeIdList = newGraph.nodes.map(it => it.id)
    for (let link of newGraph.links) {
      if (
        !nodeIdList.includes(link.sourceId) ||
        !nodeIdList.includes(link.targetId)
      ) {
        return
      }
    }
    this.draw()
  }

  beforeMount() {
    const nodeConfig = this.config.node
    this.nodeWidthHalf = nodeConfig.width / 2
    this.nodeBorderWidthDouble = nodeConfig.borderWidth * 2
    this.nodePaddingDouble = nodeConfig.padding * 2

    this.collisionRadius = nodeConfig.width * 0.5
  }

  mounted() {
    if (this.redrawOnWindowResize) {
      window.addEventListener('resize', this.updateGraph)
    }
    this.tooltip = appendTooltipElementToBody()
    this.draw()
  }

  beforeDestroy() {
    if (this.redrawOnWindowResize) {
      window.removeEventListener('resize', this.updateGraph)
    }
  }

  private draw() {
    this.populateLinkTypes()
    this.createArrowheadDefinitions(this.svg)
    ;[this.simNodes, this.simLinks] = toSim(this.graph)
    this.updateGraph()
  }

  private updateGraph() {
    this.updateNodes(this.nodesG)
    this.updateLinks(this.linksG)
    // Increase the height of the SVG to fit its contents.
    const bBox = this.svg.getBBox()
    const graphHeight = bBox.y + bBox.height + NODE_BORDER_WIDTH
    this.svg.setAttribute('height', graphHeight.toString())
  }

  private createArrowheadDefinitions(svgElement: SVGElement) {
    d3.select(svgElement)
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

  private updateLinks(linksG: SVGGElement) {
    const links = d3
      .select(linksG)
      .selectAll<SVGGElement, SimLink<N, L>>('g')
      .data(this.simLinks, d => d.id)
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

  private updateNodes(nodesG: SVGGElement) {
    const nodeConfig = this.config.node
    const width = this.svg.clientWidth
    this.updateColumnX(width)
    const nodes = d3
      .select(nodesG)
      .selectAll<SVGGElement, SimNode<N>>('g')
      .data(this.simNodes, (node: SimNode<N>) => node.id)
      .join(
        enter => {
          const node = enter.append('g')
          node
            .append('rect')
            .attr('class', d => `node-border ${d.classes ?? ''}`)
            .attr('x', NODE_BORDER_WIDTH)
            .attr('y', NODE_BORDER_WIDTH)
            .attr('width', nodeConfig.width - this.nodeBorderWidthDouble)
          node
            .append('svg')
            .attr('class', 'node-content')
            .attr('x', NODE_PADDING)
            .attr('y', NODE_PADDING)
            .attr('width', nodeConfig.width - this.nodePaddingDouble)
          return node
        },
        update => update,
        exit => exit.remove()
      )
    this.renderNodesContent(nodes)
    this.layoutNodes(nodes)
    return this.linkTooltipToSvgSvgElement(nodes)
  }

  private renderNodesContent(
    nodes: d3.Selection<SVGGElement, SimNode<N>, SVGGElement, unknown>
  ) {
    nodes.each(
      (
        d: SimNode<N>,
        index: number,
        nodeArray: SVGGElement[] | ArrayLike<SVGGElement>
      ) => {
        const nodeG = nodeArray[index]
        const nodeSvg = nodeG.querySelector('svg')
        if (nodeSvg === null) return

        this.config.renderNodeContent(this.config.node, d, nodeSvg)

        // Set content height to fit the rendered content.
        const bBox = nodeSvg.getBBox()
        const contentHeight = bBox.y + bBox.height
        nodeSvg.setAttribute('height', contentHeight.toString())

        // Set node height to fit the contents, padding, and border,
        // both in the svg element as well as in the SimNode data.
        const nodeHeight = contentHeight + this.nodePaddingDouble
        nodeSvg.previousElementSibling?.setAttribute(
          'height',
          nodeHeight.toString()
        )
        d.height = nodeHeight
      }
    )
  }

  private layoutNodes(
    nodes: d3.Selection<SVGGElement, SimNode<N>, SVGGElement, unknown>
  ) {
    // An array of y-values for the columns. The 3 internal columns are treated
    // as 1 with respect to the y-axis.
    const y = new Array<number>(3)
    let yIndex = 0
    nodes.each(
      (
        d: SimNode<N>,
        index: number,
        nodeArray: SVGGElement[] | ArrayLike<SVGGElement>
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
        nodeG.setAttribute('transform', `translate(${d.x} ${d.y})`)
      }
    )
  }

  private linkTooltipToSvgSvgElement(
    nodes: d3.Selection<SVGGElement, SimNode<N>, SVGGElement, unknown>
  ) {
    return nodes
      .on('mouseover.tooltip', d => {
        this.tooltip.transition().duration(300).style('opacity', 1.0)
        this.tooltip
          .html(d.tooltipText)
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY + 10 + 'px')
      })
      .on('mouseout.tooltip', () => {
        this.tooltip.transition().duration(100).style('opacity', 0)
      })
      .on('mousemove', () => {
        this.tooltip
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY + 10 + 'px')
      })
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

  private nodeWidthHalf: number = 0
  private nodeBorderWidthDouble: number = 0
  private nodePaddingDouble: number = 0

  /** x-values for the nodes in each column */
  private columnX = new Array<number>(MAX_NODE_TYPE_VALUE).fill(0)

  private collisionRadius: number = 0

  private simNodes: SimNode<N>[] = []
  private simLinks: SimLink<N, L>[] = []
  private linkTypes: string[] = []

  private tooltip!: d3.Selection<HTMLDivElement, number, HTMLElement, any>
}

function appendTooltipElementToBody() {
  return d3
    .selectAll<HTMLDivElement, number>('.tree-ware-network-graph-tooltip')
    .data([0]) // dummy data for creating a single tooltip div
    .join<HTMLDivElement, number>('div')
    .attr('class', 'tree-ware-network-graph-tooltip')
    .style('opacity', 0)
}

/** Returns 0 if node y-value is negative, else return node y-value */
function boundedY<N>(node: SimNode<N>): number {
  return Math.max(node.y || 0, 0)
}

function toSim<N, L>(graph: Graph<N, L>): [SimNode<N>[], SimLink<N, L>[]] {
  const simNodes: SimNode<N>[] = graph.nodes.map(node => ({
    ...node,
    nodeType: node.isInternal ? NodeType.INTERNAL : NodeType.NONE,
    height: NODE_HEIGHT_MINIMUM
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
    // TODO(deepak-nulu): handle the case where an external node is both ingress and egress.
    return {
      ...link,
      id: getLinkId(source, target, link.linkType),
      source,
      target
    }
  })
  return [simNodes, simLinks]
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
  const sourceY = y + NODE_PADDING
  const targetX = x
  const targetY = y - NODE_PADDING

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

<style lang="scss" scoped>
$stroke-width: 1px;
$border-radius: 5px;
$tooltip-max-width: 500px;
$padding: 4px;

.tree-ware-network-graph {
  .node-border {
    rx: $border-radius;
    ry: $border-radius;
    stroke-width: $stroke-width;
  }
}

.tree-ware-network-graph-tooltip {
  position: absolute;
  max-width: $tooltip-max-width;
  height: auto;
  padding: $padding;
  border-style: solid;
  border-radius: $border-radius;
  border-width: $stroke-width;
  box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  border-color: black;
  color: #c2c6dc;
}
</style>
