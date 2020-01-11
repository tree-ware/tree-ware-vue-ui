<template>
  <svg ref="svg">
    <g ref="svgG" />
  </svg>
</template>

<script lang="ts">
import * as d3 from "d3";

import "reflect-metadata";
import { Component, Prop, Ref, Vue, Watch } from "vue-property-decorator";

const NODE_RADIUS = 20;

export interface Node {
  id: string;
  name: string;
  classes?: string;
}

export interface Link {
  sourceId: string;
  targetId: string;
  classes?: string;
}

export interface Graph {
  nodes: Node[];
  links: Link[];
}

@Component
export default class TreeWareNetworkGraph extends Vue {
  @Prop() readonly graph!: Graph;

  @Ref() readonly svg!: SVGElement;
  @Ref() readonly svgG!: SVGGElement;

  @Watch("graph")
  graphChanged(newGraph: Graph, oldGraph: Graph) {
    this.draw();
  }

  mounted() {
    this.draw();
  }

  private draw() {
    const width = this.svg.clientWidth;
    const height = this.svg.clientHeight;

    [this.simNodes, this.simLinks] = toSim(this.graph);

    const gSelection = d3.select(this.svgG);

    // Draw the links first so that they are below the nodes.
    const links = gSelection
      .selectAll<SVGLineElement, SimLink>("line")
      .data(this.simLinks, getLinkId)
      .enter()
      .append("line")
      .style("stroke", "white");

    const nodes = gSelection
      .selectAll<SVGCircleElement, Node>("circle")
      .data(this.simNodes, (node: Node) => node.id)
      .enter()
      .append("circle")
      .attr("r", NODE_RADIUS)
      .style("fill", "#33a7ff");

    const simulation = d3
      .forceSimulation(this.simNodes)
      .force(
        "link",
        d3
          .forceLink()
          .id(node => (node as Node).id)
          .links(this.simLinks)
      )
      .force("charge", d3.forceManyBody().strength(-450))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        links
          .attr("x1", link => link.source.x || null)
          .attr("y1", link => link.source.y || null)
          .attr("x2", link => link.target.x || null)
          .attr("y2", link => link.target.y || null);
        nodes
          .attr("cx", node => boundedX(node, NODE_RADIUS, width))
          .attr("cy", node => boundedY(node, NODE_RADIUS, height));
      });
  }

  private simNodes: SimNode[] = [];
  private simLinks: SimLink[] = [];
}

/**
 * Updates `node.x` to be between `radius` and `(width - radius)`.
 *
 * @returns the bounded value of `node.x`.
 */
function boundedX(node: SimNode, radius: number, width: number): number {
  node.x = Math.max(radius, Math.min(width - radius, node.x || 0));
  return node.x;
}

/**
 * Updates `node.y` to be between `radius` and `(height - radius)`.
 *
 * @returns the bounded value of `node.y`.
 */
function boundedY(node: SimNode, radius: number, height: number): number {
  node.y = Math.max(radius, Math.min(height - radius, node.y || 0));
  return node.y;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  classes?: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode;
  target: SimNode;
  classes?: string;
}

type SimNodeMap = { [nodeId: string]: SimNode };

function toSim(graph: Graph): [SimNode[], SimLink[]] {
  const simNodes: SimNode[] = graph.nodes.map(node => ({ ...node }));
  const simNodeMap: SimNodeMap = {};
  simNodes.forEach(node => {
    simNodeMap[node.id] = node;
  });
  const simLinks: SimLink[] = graph.links.map(link => ({
    source: getSimNode(link.sourceId, simNodeMap, simNodes),
    target: getSimNode(link.targetId, simNodeMap, simNodes),
    classes: link.classes
  }));
  return [simNodes, simLinks];
}

function getSimNode(
  nodeId: string,
  simNodeMap: SimNodeMap,
  simNodes: SimNode[]
): SimNode {
  let simNode = simNodeMap[nodeId];
  if (!simNode) {
    simNode = {
      id: nodeId,
      name: nodeId
    };
    simNodeMap[nodeId] = simNode;
    simNodes.push(simNode);
  }
  return simNode;
}

function getLinkId(link: SimLink): string {
  return `${link.source} -> ${link.target}`;
}
</script>
