import { TreeWareNetworkNodeData } from './TreeWareNetworkNode'

export const COLUMN_NODE_DATA_TYPE = 'ColumnNodeData'

export interface ColumnNodeData extends TreeWareNetworkNodeData {
  type: typeof COLUMN_NODE_DATA_TYPE
  index: number
  name: string
}

export function isColumnNodeData(
  data: TreeWareNetworkNodeData | null
): data is ColumnNodeData {
  return data?.type === COLUMN_NODE_DATA_TYPE
}
