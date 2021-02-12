export interface TreeWareNetworkNodeToolbarButtonConfig {
  tooltip: string
  onClick: () => void
}

export interface TreeWareNetworkNodeToolbarConfig {
  pin?: TreeWareNetworkNodeToolbarButtonConfig
  pinnedPinColor?: string
  zoom?: TreeWareNetworkNodeToolbarButtonConfig
  alertCount?: TreeWareNetworkNodeToolbarButtonConfig
  log?: TreeWareNetworkNodeToolbarButtonConfig
}
