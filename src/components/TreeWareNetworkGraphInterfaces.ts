import { NodeType } from './TreeWareNetworkGraphTypes'
import * as d3 from 'd3'

export interface Node {
  id: string
  name: string
  tooltipText: string
  nodeType: NodeType
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
  labelDelimitter: string
}

export interface SimNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  tooltipText: string
  nodeType: NodeType
  classes?: string
}

export interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode
  target: SimNode
  linkColor: string
  linkType: string
  classes?: string
}
