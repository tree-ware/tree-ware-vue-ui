import { computed, Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkLinkUserStateMap } from './TreeWareNetworkLink'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeUserState,
  TreeWareNetworkNodeUserStateMap
} from './TreeWareNetworkNode'
import {
  addChildToParent,
  cloneWithoutHierarchy
} from './TreeWareNetworkNodeUtil'

export function useTreeWareNetworkGraphUserManipulations(
  inputGraph: Ref<TreeWareNetworkGraph>,
  nodeUserStateMap: Ref<TreeWareNetworkNodeUserStateMap>,
  linkUserStateMap: Ref<TreeWareNetworkLinkUserStateMap>
) {
  const userGraph = computed(() =>
    computeUserManipulatedGraph(
      inputGraph.value,
      nodeUserStateMap.value,
      linkUserStateMap.value
    )
  )

  return { userGraph }
}

function computeUserManipulatedGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  linkUserStateMap: TreeWareNetworkLinkUserStateMap
): TreeWareNetworkGraph {
  const userGraph = new TreeWareNetworkGraph()

  // Process the nodes first.
  inputGraph.columns.forEach(column => {
    computeUserManipulatedColumn(column, nodeUserStateMap, userGraph)
  })
  // Add links connected to remaining nodes.
  inputGraph.links.forEach(link => {
    if (
      userGraph.containsNode(link.source.id) &&
      userGraph.containsNode(link.target.id)
    ) {
      userGraph.addLink(link)
    }
  })

  return userGraph
}

function computeUserManipulatedColumn(
  inputColumn: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  userGraph: TreeWareNetworkGraph
) {
  const nodeUserState = nodeUserStateMap[inputColumn.id]
  const isHidden = getNodeState('isHidden', nodeUserState, inputColumn)
  if (isHidden) return
  const userColumn = cloneWithoutHierarchy(inputColumn)
  userColumn.isExpanded = getNodeState('isExpanded', nodeUserState, inputColumn)
  userGraph.addColumn(userColumn)
  inputColumn.group?.children.forEach(inputChild => {
    computeUserManipulatedChildNode(
      inputChild,
      nodeUserStateMap,
      userColumn,
      userGraph
    )
  })
}

function computeUserManipulatedChildNode(
  inputChild: TreeWareNetworkNode,
  nodeUserStateMap: TreeWareNetworkNodeUserStateMap,
  userParent: TreeWareNetworkNode,
  userGraph: TreeWareNetworkGraph
) {
  const nodeUserState = nodeUserStateMap[inputChild.id]
  const isHidden = getNodeState('isHidden', nodeUserState, inputChild)
  if (isHidden) return
  const userChild = cloneWithoutHierarchy(inputChild)
  userChild.isExpanded = getNodeState('isExpanded', nodeUserState, inputChild)
  addChildToParent(userChild, userParent)
  userGraph.addNode(userChild)
  inputChild.group?.children.forEach(inputChild => {
    computeUserManipulatedChildNode(
      inputChild,
      nodeUserStateMap,
      userChild,
      userGraph
    )
  })
}

function getNodeState<K extends keyof TreeWareNetworkNodeUserState>(
  key: K,
  nodeUserState: TreeWareNetworkNodeUserState,
  node: TreeWareNetworkNode
): TreeWareNetworkNodeUserState[K] {
  return nodeUserState ? nodeUserState[key] : node[key]
}
