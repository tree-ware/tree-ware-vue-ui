import { computed, Ref } from '@vue/composition-api'
import { TreeWareNetworkGraph } from './TreeWareNetworkGraph'
import { TreeWareNetworkLinkUserStateMap } from './TreeWareNetworkLink'
import {
  TreeWareNetworkNode,
  TreeWareNetworkNodeUserStateMap
} from './TreeWareNetworkNode'
import {
  addChildToParent,
  cloneWithoutHierarchy
} from './TreeWareNetworkNodeUtil'

export function useTreeWareNetworkGraphUserManipulations(
  inputGraph: Ref<TreeWareNetworkGraph>,
  nodeUserState: Ref<TreeWareNetworkNodeUserStateMap>,
  linkUserState: Ref<TreeWareNetworkLinkUserStateMap>
) {
  const userGraph = computed(() =>
    computeUserManipulatedGraph(
      inputGraph.value,
      nodeUserState.value,
      linkUserState.value
    )
  )

  return { userGraph }
}

function computeUserManipulatedGraph(
  inputGraph: TreeWareNetworkGraph,
  nodeUserState: TreeWareNetworkNodeUserStateMap,
  linkUserState: TreeWareNetworkLinkUserStateMap
): TreeWareNetworkGraph {
  const userGraph = new TreeWareNetworkGraph()

  // Process the nodes first.
  inputGraph.columns.forEach(column => {
    computeUserManipulatedColumn(column, nodeUserState, userGraph)
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
  nodeUserState: TreeWareNetworkNodeUserStateMap,
  userGraph: TreeWareNetworkGraph
) {
  const isHidden =
    nodeUserState[inputColumn.id]?.isHidden ?? inputColumn.isHidden
  if (isHidden) return
  const userColumn = cloneWithoutHierarchy(inputColumn)
  userGraph.addColumn(userColumn)
  inputColumn.group?.children.forEach(inputChild => {
    computeUserManipulatedChildNode(
      inputChild,
      nodeUserState,
      userColumn,
      userGraph
    )
  })
}

function computeUserManipulatedChildNode(
  inputChild: TreeWareNetworkNode,
  nodeUserState: TreeWareNetworkNodeUserStateMap,
  userParent: TreeWareNetworkNode,
  userGraph: TreeWareNetworkGraph
) {
  const isHidden = nodeUserState[inputChild.id]?.isHidden ?? inputChild.isHidden
  if (isHidden) return
  const userChild = cloneWithoutHierarchy(inputChild)
  addChildToParent(userChild, userParent)
  userGraph.addNode(userChild)
  inputChild.group?.children.forEach(inputChild => {
    computeUserManipulatedChildNode(
      inputChild,
      nodeUserState,
      userChild,
      userGraph
    )
  })
}
