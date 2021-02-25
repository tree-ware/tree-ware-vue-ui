export interface CommandItemData {
  description: string
  category?: number // optional
  action: number
}

export interface CommandCategory {
  name: string
  color: string
}

export interface CommandCategoryMap {
  [category: number]: CommandCategory
}
export interface KeyShortCut {
  altKey?: boolean
  shiftKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  key: string
}
