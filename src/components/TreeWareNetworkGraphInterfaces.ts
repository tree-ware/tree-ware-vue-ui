import * as d3 from 'd3'
import { NodeType } from './TreeWareNetworkGraphTypes'

export interface NetworkGraphNodeConfig {
  width: number
  height: number
  margin: number
  borderWidth: number
  padding: number
}

export interface NetworkGraphConfig {
  node: NetworkGraphNodeConfig
  renderNodeContent: (
    config: NetworkGraphNodeConfig,
    node: d3.Selection<SVGSVGElement, SimNode, SVGGElement, unknown>
  ) => void
}

export interface Node {
  id: string
  name: string
  tooltipText: string
  isInternal: boolean
  classes?: string
}

export interface Link {
  sourceId: string
  targetId: string
  linkColor: string
  linkType: string
  classes?: string
}

export interface Graph {
  nodes: Node[]
  links: Link[]
}

export interface SimNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  tooltipText: string
  isInternal: boolean
  nodeType: NodeType
  classes?: string
}

export interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string
  source: SimNode
  target: SimNode
  linkColor: string
  linkType: string
  classes?: string
}
