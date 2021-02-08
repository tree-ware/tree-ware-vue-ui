<template>
  <g @click="toggleSelected" :class="linkClasses">
    <path class="link-start" :marker-end="arrowHeadUrl" :d="linkPaths[0]" />
    <path class="link-end" :d="linkPaths[1]" />
  </g>
</template>

<script lang="ts">
import * as d3 from 'd3'
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { SimLink } from './TreeWareNetworkGraphInterfaces'
import { LinkShape } from './TreeWareNetworkGraphTypes'

const SELF_LINK_Y_OFFSET = 10
const SELF_LINK_SIZE = 100

@Component
export default class TreeWareNetworkLink<N, L> extends Vue {
  @Prop() readonly link!: SimLink<N, L>
  @Prop({ type: Number }) readonly linkShape!: LinkShape
  @Prop({ default: false }) readonly isSelectable!: boolean
  @Prop() readonly columnGap!: number

  private get maxWidth(): number {
    return Math.max(this.columnGap - 10, 0)
  }

  private toggleSelected() {
    if (!this.isSelectable) return
    if (this.link.link.selected) {
      this.$emit('unselect', this.link.link)
    } else {
      this.$emit('select', this.link.link)
    }
  }

  private get linkClasses(): {}[] {
    return [
      'link',
      this.link.link.linkType,
      ...this.link.link.classes,
      {
        selectable: this.isSelectable,
        selected: this.link.link.selected ?? false
      }
    ]
  }

  private get arrowHeadUrl(): string {
    return `url(#${this.link.link.linkType})`
  }

  private get linkPaths(): [string, string] {
    // Set the source of the link to the middle of the right edge of the node.
    const sourceWidth = this.link.source.width
    const sourceHeight = this.link.source.height
    let sourceX = (this.link.source.x || 0) + sourceWidth
    let sourceY = (this.link.source.y || 0) + sourceHeight / 2
    // Set the target of the link to the middle of the left edge of the node.
    const targetWidth = this.link.target.width
    const targetHeight = this.link.target.height
    let targetX = this.link.target.x || 0
    let targetY = (this.link.target.y || 0) + targetHeight / 2

    // For internal nodes, the links should be on the right edge if the source
    // is above the target, and on the left edge if the source is below the
    // target.
    if (this.link.source.node.isInternal && this.link.target.node.isInternal) {
      if (sourceY < targetY) targetX += targetWidth
      else sourceX -= sourceWidth
    }

    const dx = targetX - sourceX
    let midX = (targetX + sourceX) / 2
    let midY = (targetY + sourceY) / 2

    // Render a straight link if the source and target are horizontally spread.
    if (this.linkShape === LinkShape.CURVED_IF_NEEDED && dx !== 0) {
      return [
        generateLineDefinitionString(sourceX, sourceY, midX, midY),
        generateLineDefinitionString(midX, midY, targetX, targetY)
      ]
    }

    // At this point, the source and target have the same x-coordinates. If
    // their y-coordinates are also the same, then it means the source and
    // target are the same node. So render a self-referential curved link.
    const dy = targetY - sourceY
    if (dy === 0) {
      return [getSelfReferentialLink(sourceX, sourceY).toString(), '']
    }

    // At this point, the source and target are different nodes in the same
    // column. So render a curved link.
    return getVerticalLinkPaths(sourceX, sourceY, targetY, this.maxWidth)
  }
}

function getVerticalLinkPaths(
  x: number, // a single x value since this method only supports vertical links
  sourceY: number,
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
  const midX = sourceY < targetY ? x + radiusX : x - radiusX
  const midY = sourceY < targetY ? sourceY + radiusY : sourceY - radiusY

  const rotation = 0 // this method only supports vertical lines
  const largeArc = 0 // we want the small arcs
  const sweep = 1 // we want clockwise arcs

  return [
    `M ${x} ${sourceY} A ${radiusX} ${radiusY} ${rotation} ${largeArc} ${sweep} ${midX} ${midY}`,
    `M ${midX} ${midY} A ${radiusX} ${radiusY} ${rotation} ${largeArc} ${sweep} ${x} ${targetY}`
  ]
}

function generateLineDefinitionString(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: Number
): string {
  return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY
}

function getSelfReferentialLink(x: number, y: number): d3.Path {
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
  return path
}
</script>

<style lang="scss" scoped>
$default-link-width: 1px;
$default-hover-link-width: 3px;
$selected-link-width: 4px;
$selected-hover-link-width: 5px;

.link {
  fill: none;
  stroke-width: $default-link-width;

  &.selectable {
    cursor: pointer;

    &:hover {
      stroke-width: $default-hover-link-width;
    }

    &.selected {
      stroke-width: $selected-link-width;

      &:hover {
        stroke-width: $selected-hover-link-width;
      }
    }
  }
}
</style>
