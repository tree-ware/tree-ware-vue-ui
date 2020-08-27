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
  Node,
  Link,
  SimNode,
  SimLink
} from './TreeWareNetworkGraphInterfaces'
import { NodeType } from './TreeWareNetworkGraphTypes'

const NODE_WIDTH = 100
const NODE_HEIGHT = 60
const NODE_BORDER_WIDTH = 1
const NODE_PADDING = 10

const LINKS_GAP = 10
const LABELS_VERTICAL_GAP = 12

const NODE_WIDTH_HALF = NODE_WIDTH / 2
const NODE_HEIGHT_HALF = NODE_HEIGHT / 2

const NODE_BORDER_WIDTH_DOUBLE = NODE_BORDER_WIDTH * 2
const NODE_PADDING_DOUBLE = NODE_PADDING * 2

export type SimNodeMap = { [nodeId: string]: SimNode }

@Component
export default class TreeWareNetworkGraph extends Vue {
  @Prop() readonly graph!: Graph

  @Ref() readonly svg!: SVGElement
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
    this.populateLinkTypes()
    this.populateLinksColors()
    this.draw()
  }

  mounted() {
    this.populateLinkTypes()
    this.populateLinksColors()
    this.draw()
  }

  private draw() {
    const width = this.svg.clientWidth
    const height = this.svg.clientHeight
    ;[this.simNodes, this.simLinks] = toSim(this.graph)

    const labelDelimitter = this.graph.labelDelimitter

    // Create the defs for the markers
    this.initializeMarkersAsDefs(this.svg)
    // Initialize tooltip element
    const tooltip = this.appendTooltipElementToBody()

    // Create the links
    const finalPath = this.createPath(this.linksG, 'path-final', false)
    const initialPath = this.createPath(this.linksG, 'path-initial', true)

    // Create the nodes
    const nodes = this.createNodes(this.nodesG, labelDelimitter, tooltip)

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
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(NODE_HEIGHT * (3 / 4)))
      .on('tick', () => {
        this.moveLinksOnTick(finalPath, width, height, false)
        this.moveLinksOnTick(initialPath, width, height, true)
        nodes.attr('transform', node => {
          const x = boundedX(node, width) - NODE_WIDTH_HALF
          const y = boundedY(node, height)
          return `translate(${x} ${y})`
        })
      })
  }

  private appendTooltipElementToBody() {
    return d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
  }

  private initializeMarkersAsDefs(svgElement: SVGElement) {
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

  private createPath(
    linksG: SVGElement,
    pathId: string,
    createMarker: boolean
  ) {
    const path = d3
      .select(linksG)
      .selectAll<SVGLineElement, SimLink>(`#${pathId}`)
      .data(this.simLinks, getLinkId)
      .join('path')
      .style('stroke', d => d.linkColor)
      .style('fill', 'none')
      .attr('id', pathId)
    if (createMarker) path.attr('marker-end', d => `url(#${d.linkColor})`)
    return path
  }

  private createNodes(
    nodesG: SVGGElement,
    labelDelimitter: string,
    tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
  ) {
    const nodes = d3
      .select(nodesG)
      .selectAll<SVGGElement, Node>('g')
      .data(this.simNodes, (node: Node) => node.id)
      .join(
        enter => {
          const node = enter.append('g')
          node
            .append('rect')
            .attr('class', 'node-border')
            .attr('x', NODE_BORDER_WIDTH)
            .attr('y', NODE_BORDER_WIDTH)
            .attr('width', NODE_WIDTH - NODE_BORDER_WIDTH_DOUBLE)
            .attr('height', NODE_HEIGHT - NODE_BORDER_WIDTH_DOUBLE)
          node
            .append('svg')
            .attr('class', 'node-content')
            .attr('x', NODE_PADDING)
            .attr('y', NODE_PADDING)
            .attr('width', NODE_WIDTH - NODE_PADDING_DOUBLE)
            .attr('height', NODE_HEIGHT - NODE_PADDING_DOUBLE)
            .each(function (d: SimNode) {
              const labels = d.name.split(labelDelimitter)
              labels.forEach((label, i) => {
                d3.select(this)
                  .attr('id', label + i)
                  .append('text')
                  .text(label)
                  .attr('dy', (i + 1) * LABELS_VERTICAL_GAP)
              })
            })
          return node
        },
        update => update,
        exit => exit.remove()
      )
    return this.linkTooltipToSvgSvgElement(nodes, tooltip)
  }

  private linkTooltipToSvgSvgElement(
    nodes: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>,
    tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
  ) {
    return nodes
      .on('mouseover.tooltip', d => {
        tooltip.transition().duration(300).style('opacity', 1.0)
        tooltip
          .html(d.tooltipText)
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY + 10 + 'px')
      })
      .on('mouseout.tooltip', function () {
        tooltip.transition().duration(100).style('opacity', 0)
      })
      .on('mousemove', function () {
        tooltip
          .style('left', d3.event.pageX + 'px')
          .style('top', d3.event.pageY + 10 + 'px')
      })
  }

  private moveLinksOnTick(
    path: d3.Selection<
      SVGLineElement | SVGPathElement,
      SimLink,
      SVGElement,
      unknown
    >,
    width: number,
    height: number,
    isInitial: boolean
  ) {
    const linkTypes = this.linkTypes
    path.attr('d', function (d) {
      let sourceX = boundedX(d.source, width) + NODE_WIDTH_HALF,
        targetX = boundedX(d.target, width) - NODE_WIDTH_HALF,
        sourceY = boundedY(d.source, height) + NODE_HEIGHT_HALF,
        targetY = boundedY(d.target, height) + NODE_HEIGHT_HALF
      if (
        d.source.nodeType === NodeType.INTERNAL &&
        d.target.nodeType === NodeType.INTERNAL
      ) {
        if (sourceY < targetY) {
          targetX = boundedX(d.target, width) + NODE_WIDTH_HALF
        } else {
          sourceX = boundedX(d.source, width) - NODE_WIDTH_HALF
        }
      }
      const dx = targetX - sourceX,
        dy = targetY - sourceY,
        dr = Math.sqrt(dx * dx + dy * dy)

      // for len - 30-60-90 triangle rule, trig to calculate mid points
      let len = dr - (dr / 2) * Math.sqrt(3),
        endX = (targetX + sourceX) / 2,
        endY = (targetY + sourceY) / 2

      const index = linkTypes.indexOf(d.linkType)
      if (index !== -1) {
        endY += index * LINKS_GAP
      }
      endX = endX + (dy * len) / dr
      endY = endY + (-dx * len) / dr

      if (isInitial)
        return generateArcDefinitionString(sourceX, sourceY, dr, endX, endY)
      else return generateArcDefinitionString(endX, endY, dr, targetX, targetY)
    })
  }

  private populateLinksColors() {
    this.graph.links.forEach(it => {
      if (!this.linkColors.includes(it.linkColor))
        this.linkColors.push(it.linkColor)
    })
  }

  private populateLinkTypes() {
    this.graph.links.forEach(it => {
      if (!this.linkTypes.includes(it.linkType))
        this.linkTypes.push(it.linkType)
    })
  }

  private simNodes: SimNode[] = []
  private simLinks: SimLink[] = []
  private linkColors: string[] = []
  private linkTypes: string[] = []
}
/**
 For ingress nodes - position towards left edge
 For internal nodes - position at the center
 For egress nodes - position towards the right edge

 @returns the bounded value of `node.x`.
 */
function boundedX(node: SimNode, width: number): number {
  switch (node.nodeType) {
    case NodeType.INGRESS: {
      node.x = NODE_WIDTH_HALF
      return node.x
    }
    case NodeType.INTERNAL: {
      node.x = width / 2
      return node.x
    }
    case NodeType.EGRESS: {
      node.x = width - NODE_WIDTH_HALF
      return node.x
    }
  }
}

/**
 * @returns the bounded value of `node.y`.
 */
function boundedY(node: SimNode, height: number): number {
  node.y = Math.max(NODE_HEIGHT_HALF, node.y || NODE_HEIGHT_HALF)
  node.y = Math.min(node.y, height - NODE_HEIGHT)
  return node.y
}

function toSim(graph: Graph): [SimNode[], SimLink[]] {
  const simNodes: SimNode[] = graph.nodes.map(node => {
    return node
  })
  const simNodeMap: SimNodeMap = {}
  simNodes.forEach(node => {
    simNodeMap[node.id] = node
  })
  const simLinks: SimLink[] = graph.links.map(link => ({
    source: getSimNode(link.sourceId, simNodeMap),
    target: getSimNode(link.targetId, simNodeMap),
    linkColor: link.linkColor,
    linkType: link.linkType,
    classes: link.classes
  }))
  return [simNodes, simLinks]
}

function getSimNode(nodeId: string, simNodeMap: SimNodeMap): SimNode {
  let simNode = simNodeMap[nodeId]
  return simNode
}

function getLinkId(link: SimLink): string {
  return `${link.source.id}->${link.target.id}:${link.linkType}`
}

function generateArcDefinitionString(
  sourceX: number,
  sourceY: number,
  radius: number,
  targetX: number,
  targetY: Number
): string {
  sourceX = sourceX || 0
  sourceY = sourceY || 0
  radius = radius || 0
  targetX = targetX || 0
  targetY = targetY || 0
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

.tooltip {
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
