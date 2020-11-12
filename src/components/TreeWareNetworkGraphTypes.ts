export enum NodeType {
  NONE = 0,
  INTERNAL = 1 << 0,
  INGRESS = 1 << 1,
  EGRESS = 1 << 2
}

export enum LinkDirection {
  INTERNAL,
  INGRESS,
  EGRESS
}

export enum LinkShape {
  CURVED_IF_NEEDED,
  CURVED_ALWAYS
}

/** The maximum value when all NodeType flags are combined. */
export const MAX_NODE_TYPE_VALUE = Object.values(NodeType).reduce(
  (previous: number, value: string | NodeType) => {
    return previous + (typeof value === 'string' ? 0 : value.valueOf())
  },
  0
)
