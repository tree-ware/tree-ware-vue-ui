export interface CommandItemData {
  description: string
  category?: number // optional
  action: (() => void) | number // number type is deprecated
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
