import * as d3 from 'd3'
import { VueConstructor } from 'vue'
import { LinkShape, NodeType } from './TreeWareNetworkGraphTypes'

export interface NetworkGraphNodeConfig {
  width: number
  margin: number
  /**
   * The Vue component to use for the node contents.
   * The component will have to use `this.$parent` to access $-properties if
   * they are undefined in `this`. For example, `this.$route` will be
   * `undefined` and therefore `this.$parent.$route` will have to be used.
   */
  content: VueConstructor
}

export interface NetworkGraphLinkConfig {
  shape: LinkShape
}

export interface NetworkGraphConfig<N> {
  node: NetworkGraphNodeConfig
  link: NetworkGraphLinkConfig
}

export interface Node<N> {
  id: string
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
  height: number
}

export interface NodeCounts {
  ingress: number
  internal: number
  egress: number
}

export interface SimLink<N, L>
  extends Link<L>,
    d3.SimulationLinkDatum<SimNode<N>> {
  id: string
  source: SimNode<N>
  target: SimNode<N>
}
