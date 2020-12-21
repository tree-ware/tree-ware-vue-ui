import * as d3 from 'd3'
import { VueConstructor } from 'vue'
import { LinkDirection, LinkShape, NodeType } from './TreeWareNetworkGraphTypes'

export interface NetworkGraphNodeConfig<N> {
  width: number
  margin: number
  compare: (a: Node<N>, b: Node<N>) => number
  /**
   * The Vue component to use for the node contents.
   * The Vue component instance will be passed a property named `node` of type
   * `Node<N>`. It should emit a boolean 'pin' event when it's pinned/unpinned.
   */
  content: VueConstructor
}

export interface NetworkGraphLinkConfig {
  shape: LinkShape
}

export interface NetworkGraphConfig<N> {
  node: NetworkGraphNodeConfig<N>
  link: NetworkGraphLinkConfig
}

export interface Node<N> {
  id: string
  isInternal: boolean
  isPinned: boolean
  data: N
  classes: string
  children: Node<N>[] | null
}

export interface Link<L> {
  sourceId: string
  targetId: string
  /** Used as the arrowhead marker ID and as the class for the arrow lines. */
  linkType: string
  data: L
  classes: string
  selected: boolean
}

export interface Graph<N, L> {
  nodes: Node<N>[]
  links: Link<L>[]
}

export interface SimNode<N> extends d3.SimulationNodeDatum {
  nodeType: NodeType
  width: number
  height: number
  parent: SimNode<N> | null
  children: SimNode<N>[] | null
  node: Node<N>
}

export interface NodeCounts {
  ingress: number
  internal: number
  egress: number
}

export interface ShowDirections {
  ingress: boolean
  internal: boolean
  egress: boolean
}

export interface SimLink<N, L> extends d3.SimulationLinkDatum<SimNode<N>> {
  id: string
  direction: LinkDirection
  source: SimNode<N>
  target: SimNode<N>
  link: Link<L>
}

export interface SimGraph<N, L> {
  nodes: SimNode<N>[]
  links: SimLink<N, L>[]
}
