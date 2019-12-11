export interface Tag {
    key: string
    value: string
}

export interface ValueCount {
    value: string
    count: number
}
export type TagValueCounts = { [tagKey: string]: ValueCount[] }
