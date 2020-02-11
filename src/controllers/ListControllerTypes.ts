import { Observable } from 'rxjs'

export interface TimeRange {
    startTime: Date
    endTime: Date
}

export interface ListFilter<ValueFilters> {
    timeRange?: TimeRange
    pageSize: number
    valueFilters: ValueFilters
}

export interface ListData<Item, Token> {
    items: Observable<Item>

    /** 
     * Token for fetching the next page of the list.
     * Its value is valid only when the `items` observable has completed
     * successfully. Its value might be changing while the `items` observable
     * is streaming.
     */
    nextPageToken: Token | undefined
}

export type ListFetchFunction<ValueFilters, Item, Token> =
    (filter: ListFilter<ValueFilters>, pageToken: Token | undefined) => ListData<Item, Token>

export interface ListControllerUiInterface<ValueFilters> {
    filter: ListFilter<ValueFilters>
    page: number
    maxPage: number
    isLoading: boolean
    error: string

    filterChanged(filter: ListFilter<ValueFilters>): void
    pageChanged(page: number): void
    refresh(): void
}
