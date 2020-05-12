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

export interface NestedList<Data> {
    nestedList: Data[]
}

export interface ListData<Data, Token> {
    items: Observable<Data>

    /** 
     * Token for fetching the next page of the list.
     * Its value is valid only when the `items` observable has completed
     * successfully. Its value might be changing while the `items` observable
     * is streaming.
     */
    nextPageToken: Token | undefined
}

export type ListFetchFunction<ValueFilters, Data, Token> =
    (filter: ListFilter<ValueFilters>, pageToken: Token | undefined) => ListData<Data, Token>

export interface UiSelectionState {
    index: number
    selected: boolean
    visible: boolean
    nestingLevel: number
    nestedList: UiSelectionState[]
    nestedVisible: boolean
}

export type UiStateFactory<Data, UiState> = (index: number, data: Data) => UiState

export interface ListItem<Data, UiState> {
    data: Data
    uiState: UiState
}

export interface ListControllerUiInterface<ValueFilters> {
    filter: ListFilter<ValueFilters>
    pageSize: number
    page: number
    maxPage: number
    isLoading: boolean
    error: string

    filterChanged(filter: ListFilter<ValueFilters>): void
    pageSizeChanged(pageSize: number): void
    pageChanged(page: number): void
    refresh(): void
}
