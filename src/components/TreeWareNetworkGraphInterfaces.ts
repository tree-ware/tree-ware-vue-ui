import * as d3 from 'd3'
import { LinkShape, NodeType } from './TreeWareNetworkGraphTypes'

export interface NetworkGraphNodeConfig {
  width: number
  height: number
  margin: number
  borderWidth: number
  padding: number
}

export interface NetworkGraphLinkConfig {
  shape: LinkShape
}

export interface NetworkGraphConfig<N> {
  node: NetworkGraphNodeConfig
  link: NetworkGraphLinkConfig
  renderNodeContent: (
    config: NetworkGraphNodeConfig,
    node: Node<N>,
    nodeSvg: SVGSVGElement
  ) => void
}

export interface Node<N> {
  id: string
  tooltipText: string
  isInternal: boolean
  data: N
  classes?: string
}

export interface Link<L> {
  sourceId: string
  targetId: string
  /** Used as the arrowhead marker ID and as the class for the arrow lines. */
  linkType: string
  data: L
  classes?: string
}

export interface Graph<N, L> {
  nodes: Node<N>[]
  links: Link<L>[]
}

export interface SimNode<N> extends Node<N>, d3.SimulationNodeDatum {
  nodeType: NodeType
}

export interface SimLink<N, L>
  extends Link<L>,
    d3.SimulationLinkDatum<SimNode<N>> {
  id: string
  source: SimNode<N>
  target: SimNode<N>
}
