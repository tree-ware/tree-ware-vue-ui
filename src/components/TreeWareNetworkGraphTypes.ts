export enum NodeType {
  NONE = 0,
  INTERNAL = 1 << 0,
  INGRESS = 1 << 1,
  EGRESS = 1 << 2
}
