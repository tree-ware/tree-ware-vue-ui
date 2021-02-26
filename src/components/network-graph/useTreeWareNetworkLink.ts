import { computed, ref, Ref } from '@vue/composition-api'
import * as d3 from 'd3'
import { TreeWareNetworkLink } from './TreeWareNetworkLink'

const SELF_LINK_Y_OFFSET = 10
const SELF_LINK_SIZE = 100

export function useTreeWareNetworkLink(
  link: Ref<TreeWareNetworkLink>,
  columnGap: Ref<number>
) {
  const linkClasses = computed(() => [
    'tree-ware-network-link-view',
    link.value.linkType,
    ...link.value.classes,
    {
      selectable: link.value.canSelect,
      selected: link.value.isSelected
    }
  ])

  const arrowHeadUrl = computed(() => {
    return `url(#${link.value.linkType})`
  })

  const linkPaths = ref(['', ''])
  function updateLinkPaths() {
    const maxWidth = Math.max(columnGap.value - 10, 0)
    linkPaths.value = computeLinkPaths(link.value, maxWidth)
  }

  return { linkClasses, arrowHeadUrl, linkPaths, updateLinkPaths }
}

function computeLinkPaths(
  link: TreeWareNetworkLink,
  maxWidth: number
): [string, string] {
  const sourceDom = document.getElementById(link.source.id)
  const targetDom = document.getElementById(link.target.id)
  if (!sourceDom || !targetDom) return ['', '']

  // Compute the mid-points of the nodes.
  const sourceHalfWidth = sourceDom.offsetWidth / 2
  const targetHalfWidth = targetDom.offsetWidth / 2
  const sourceMidX = (sourceDom.offsetLeft || 0) + sourceHalfWidth
  const targetMidX = (targetDom.offsetLeft || 0) + targetHalfWidth

  const differentColumns = sourceMidX !== targetMidX

  // For nodes not in the same column, links should be from the right edge of
  // the source to the left edge of the target.
  // For nodes in the same column, links should be on the right edge if the
  // source is above the target, and on the left edge if the source is below
  // the target.
  const sourceY = (sourceDom.offsetTop || 0) + sourceDom.offsetHeight / 2
  const targetY = (targetDom.offsetTop || 0) + targetDom.offsetHeight / 2
  const [sourceX, targetX] = differentColumns
    ? [sourceMidX + sourceHalfWidth, targetMidX - targetHalfWidth]
    : sourceY < targetY
    ? [sourceMidX + sourceHalfWidth, targetMidX + targetHalfWidth]
    : [sourceMidX - sourceHalfWidth, targetMidX - targetHalfWidth]

  // Determine the link paths.
  if (differentColumns) {
    return getStraightLinkPaths(sourceX, sourceY, targetX, targetY)
  } else if (sourceY !== targetY) {
    // Same column.
    return getCurvedLinkPaths(sourceX, sourceY, targetX, targetY, maxWidth)
  } else {
    // Same node.
    return getSelfLinkPaths(sourceX, sourceY)
  }
}

function getStraightLinkPaths(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): [string, string] {
  const midX = (sourceX + targetX) / 2
  const midY = (sourceY + targetY) / 2
  return [
    `M ${sourceX} ${sourceY} L ${midX} ${midY}`,
    `M ${midX} ${midY} L ${targetX} ${targetY}`
  ]
}

function getCurvedLinkPaths(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  maxWidth: number
): [string, string] {
  // The overall link is the right or left half of an ellipse whose major axis
  // is vertical and minor axis is horizontal. (x, sourceY) & (x, targetY) are
  // the endpoints of the major axis. If sourceY is above targetY, the right
  // half of the ellipse is used, else the left half of the ellipse is used.
  // To allow arrowheads in the middle of the link, the ellipse half is again
  // divided into two parts and returned as two separate paths.

  const radiusY = Math.abs(targetY - sourceY) / 2
  // Set the minor axis radius is set to 30% of the major axis radius.
  // Limit the minor axis radius to maxWidth.
  const radiusX = Math.min(radiusY * 0.3, maxWidth)

  // We want to break the link in the middle in order to put an arrowhead in
  // the middle. The midpoint of the link is the point where the minor axis of
  // the ellipse intersects the ellipse. The midpoint is calculated from the
  // location of the major axis endpoints and the minor axis radius.
  // The side on which the midpoint lies depends on the direction we want the
  // link to be (top-to-bottom or bottom-to-top).
  const midX = sourceY < targetY ? sourceX + radiusX : sourceX - radiusX
  const midY = sourceY < targetY ? sourceY + radiusY : sourceY - radiusY

  const rotation = 0 // this method only supports vertical lines
  const largeArc = 0 // we want the small arcs
  const sweep = 1 // we want clockwise arcs

  return [
    `M ${sourceX} ${sourceY} A ${radiusX} ${radiusY} ${rotation} ${largeArc} ${sweep} ${midX} ${midY}`,
    `M ${midX} ${midY} A ${radiusX} ${radiusY} ${rotation} ${largeArc} ${sweep} ${targetX} ${targetY}`
  ]
}

function getSelfLinkPaths(x: number, y: number): [string, string] {
  // Separate the source and target of the link a bit.
  const sourceX = x
  const sourceY = y + SELF_LINK_Y_OFFSET
  const targetX = x
  const targetY = y - SELF_LINK_Y_OFFSET

  // The self-referential curved link is implemented as a bezier path with
  // the following 2 control points. Control point 1 is to the left and
  // below the source point. Control point 2 is to the left and above the
  // source point.
  const control1X = sourceX - SELF_LINK_SIZE
  const control1Y = sourceY + SELF_LINK_SIZE
  const control2X = targetX - SELF_LINK_SIZE
  const control2Y = targetY - SELF_LINK_SIZE

  const path = d3.path()
  path.moveTo(sourceX, sourceY)
  path.bezierCurveTo(
    control1X,
    control1Y,
    control2X,
    control2Y,
    targetX,
    targetY
  )
  return [path.toString(), '']
}
