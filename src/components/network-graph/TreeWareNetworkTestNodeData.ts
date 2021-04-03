import { TreeWareNetworkNodeData } from './TreeWareNetworkNode'

export const TREE_WARE_NETWORK_TEST_NODE_DATA_TYPE =
  'TreeWareNetworkTestNodeData'

export interface TreeWareNetworkTestNodeData extends TreeWareNetworkNodeData {
  name: typeof TREE_WARE_NETWORK_TEST_NODE_DATA_TYPE
}

export function isTreeWareNetworkTestNodeData(
  data: TreeWareNetworkNodeData | null
): data is TreeWareNetworkTestNodeData {
  return data?.type === TREE_WARE_NETWORK_TEST_NODE_DATA_TYPE
}
