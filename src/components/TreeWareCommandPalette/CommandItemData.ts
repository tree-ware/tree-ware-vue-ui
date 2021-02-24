export interface CommandItemData {
  description: string
  category: number
  action: number
}

export interface CommandCategory {
  name: string
  color: string
}

export interface CommandCategoryMap {
  [category: number]: CommandCategory
}
