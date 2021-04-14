import { TreeWareImageType } from './TreeWareImageTypes'

export interface TreeWareImageData {
  type: TreeWareImageType
  content: string
  description?: string
  classes: string[]
}
