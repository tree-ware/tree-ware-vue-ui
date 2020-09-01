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

const LINKS_GAP = 10

export type SimNodeMap = { [nodeId: string]: SimNode }

@Component
export default class TreeWareNetworkGraph extends Vue {
  @Prop() readonly config!: NetworkGraphConfig
  @Prop() readonly graph!: Graph
  @Prop({ default: false }) readonly redrawOnWindowResize!: boolean

  @Ref() readonly svg!: SVGSVGElement
  @Ref() readonly linksG!: SVGGElement
  @Ref() readonly nodesG!: SVGGElement

  @Watch('graph', { deep: true })
  graphChanged(newGraph: Graph, oldGraph: Graph) {
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
    this.nodeHeightHalf = nodeConfig.height / 2
    this.nodeBorderWidthDouble = nodeConfig.borderWidth * 2
    this.nodePaddingDouble = nodeConfig.padding * 2

    this.collisionRadius = nodeConfig.height * 0.75
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
    this.populateLinkColorsAndTypes()
    this.createArrowheadDefinitions(this.svg)
    ;[this.simNodes, this.simLinks] = toSim(this.graph)
    this.staticLayout()
  }

  private staticLayout() {
    // Sort the nodes by name so that they are easier to find.
    this.simNodes.sort((a, b) => a.name.localeCompare(b.name))
    const deltaY = this.config.node.height + this.config.node.margin
    // An array of y-values for the columns. The 3 internal columns are treated
    // as 1 with respect to the y-axis.
    const y = new Array<number>(3)
    let yIndex = 0
    this.simNodes.forEach(node => {
      switch (node.nodeType) {
        case NodeType.INGRESS:
          yIndex = 0
          break
        case NodeType.EGRESS:
          yIndex = 2
          break
        default:
          yIndex = 1
      }
      node.y = y[yIndex] ?? 0
      y[yIndex] = node.y + deltaY
    })
    this.updateGraph()
  }

  private forceLayout() {
    // Define forces on the graph
    d3.forceSimulation(this.simNodes)
      .force(
        'link',
        d3
          .forceLink()
          .id(node => (node as Node).id)
          .links(this.simLinks)
      )
      .force('charge', d3.forceManyBody())
      .force('collision', d3.forceCollide().radius(this.collisionRadius))
      .on('tick', () => {
        this.updateGraph()
      })
  }

  private updateGraph() {
    this.updateNodes(this.nodesG)
    this.updateLinks(this.linksG)
    // Increase the height of the SVG to fit its contents.
    const bBox = this.svg.getBBox()
    const graphHeight = bBox.y + bBox.height
    this.svg.setAttribute('height', graphHeight.toString())
  }

  private createArrowheadDefinitions(svgElement: SVGElement) {
    d3.select(svgElement)
      .append('defs')
      .selectAll('marker')
      .data(this.linkColors)
      .enter()
      .append('marker')
      .attr('fill', d => d)
      .attr('id', String)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('markerWidth', 16)
      .attr('markerHeight', 20)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L10,0L0,3')
  }

  private updateLinks(linksG: SVGGElement) {
    const links = d3
      .select(linksG)
      .selectAll<SVGGElement, SimLink>('g')
      .data(this.simLinks, d => d.id)
      .join(
        enter => {
          const linkG = enter
            .append('g')
            .style('stroke', d => d.linkColor)
            .style('fill', 'none')
          const linkStart = linkG.append('path').attr('class', 'link-start')
          linkStart.attr('marker-end', d => `url(#${d.linkColor})`)
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
          d: SimLink,
          index: number,
          links: SVGGElement[] | ArrayLike<SVGGElement>
        ) => {
          const linkG = d3.select<SVGGElement, SimLink>(links[index])
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
      .selectAll<SVGGElement, SimNode>('g')
      .data(this.simNodes, (node: SimNode) => node.id)
      .join(
        enter => {
          const node = enter.append('g')
          node
            .append('rect')
            .attr('class', 'node-border')
            .attr('x', NODE_BORDER_WIDTH)
            .attr('y', NODE_BORDER_WIDTH)
            .attr('width', nodeConfig.width - this.nodeBorderWidthDouble)
            .attr('height', nodeConfig.height - this.nodeBorderWidthDouble)
          const nodeContent = node
            .append('svg')
            .attr('class', 'node-content')
            .attr('x', NODE_PADDING)
            .attr('y', NODE_PADDING)
            .attr('width', nodeConfig.width - this.nodePaddingDouble)
            .attr('height', nodeConfig.height - this.nodePaddingDouble)
          this.config.renderNodeContent(this.config.node, nodeContent)
          return node
        },
        update => update,
        exit => exit.remove()
      )
      .attr('transform', (node: SimNode) => {
        const x = this.boundedX(node)
        const y = boundedY(node)
        node.x = x
        node.y = y
        return `translate(${x} ${y})`
      })
    return this.linkTooltipToSvgSvgElement(nodes)
  }

  private linkTooltipToSvgSvgElement(
    nodes: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>
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
    d: SimLink,
    linkStart: d3.Selection<SVGPathElement, SimLink, null, undefined>,
    linkEnd: d3.Selection<SVGPathElement, SimLink, null, undefined>
  ) {
    // Set the source of the link to the middle of the right edge of the node.
    let sourceX = (d.source.x || 0) + this.config.node.width
    let sourceY = (d.source.y || 0) + this.nodeHeightHalf
    // Set the target of the link to the middle of the left edge of the node.
    let targetX = d.target.x || 0
    let targetY = (d.target.y || 0) + this.nodeHeightHalf

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

    if (this.config.link.shape === LinkShape.CURVED_IF_NEEDED && dx !== 0) {
      // Use a straight arrow when the source and target horizontally spread.
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

    const dy = targetY - sourceY
    const dr = Math.sqrt(dx * dx + dy * dy)

    // for len - 30-60-90 triangle rule, trig to calculate mid points
    let len = dr - (dr / 2) * Math.sqrt(3)

    const index = this.linkTypes.indexOf(d.linkType)
    if (index !== -1) {
      midY += index * LINKS_GAP
    }
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

  private populateLinkColorsAndTypes() {
    this.linkColors = []
    this.linkTypes = []
    this.graph.links.forEach(it => {
      if (!this.linkColors.includes(it.linkColor)) {
        this.linkColors.push(it.linkColor)
      }
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
  private boundedX(node: SimNode): number {
    return this.columnX[node.nodeType]
  }

  private nodeWidthHalf: number = 0
  private nodeHeightHalf: number = 0
  private nodeBorderWidthDouble: number = 0
  private nodePaddingDouble: number = 0

  /** x-values for the nodes in each column */
  private columnX = new Array<number>(MAX_NODE_TYPE_VALUE).fill(0)

  private collisionRadius: number = 0

  private simNodes: SimNode[] = []
  private simLinks: SimLink[] = []
  private linkColors: string[] = []
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
function boundedY(node: SimNode): number {
  return Math.max(node.y || 0, 0)
}

function toSim(graph: Graph): [SimNode[], SimLink[]] {
  const simNodes: SimNode[] = graph.nodes.map(node => ({
    ...node,
    nodeType: node.isInternal ? NodeType.INTERNAL : NodeType.NONE
  }))
  const simNodeMap: SimNodeMap = {}
  simNodes.forEach(node => {
    simNodeMap[node.id] = node
  })
  const simLinks: SimLink[] = graph.links.map(link => {
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
      id: getLinkId(source, target, link.linkType),
      source,
      target,
      linkColor: link.linkColor,
      linkType: link.linkType,
      classes: link.classes
    }
  })
  return [simNodes, simLinks]
}

function getLinkId(source: SimNode, target: SimNode, linkType: string): string {
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
