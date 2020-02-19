import {
    ListControllerUiInterface, ListFetchFunction, ListFilter, ListItem, UiStateFactory
} from './ListControllerTypes'

import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

export class ListController<ValueFilters, Data, Token, UiState = undefined> implements ListControllerUiInterface<ValueFilters> {
    constructor(
        private filterInternal: ListFilter<ValueFilters>,
        private readonly fetchFunction: ListFetchFunction<ValueFilters, Data, Token>,
        private readonly uiStateFactory: UiStateFactory<UiState> | undefined = undefined,
        private readonly isLoadingCallback?: (loading: boolean) => void
    ) {
        this.resetToFirstPage()
    }

    destroy(): void {
        this.destroyed.complete()
    }

    get filter(): ListFilter<ValueFilters> {
        return this.filterInternal
    }

    get page(): number {
        return this.pageInternal
    }

    get maxPage(): number {
        return this.nextPageTokens.length - 1
    }

    get isLoading(): boolean {
        return this.isLoadingInternal
    }

    set isLoading(loading: boolean) {
        this.isLoadingInternal = loading
        if (this.isLoadingCallback) this.isLoadingCallback(loading)
    }

    get error(): string {
        return this.errorInternal
    }
    set error(value: string) {
        this.errorInternal = value
    }

    get items(): ListItem<Data, UiState>[] {
        return this.itemsInternal
    }

    filterChanged(filter: ListFilter<ValueFilters>): void {
        this.filterInternal = filter
        this.resetToFirstPage()
        this.fetchList()
    }

    pageChanged(page: number): void {
        if (page < 1 || page > this.maxPage) {
            console.error('ListController page out of bounds:', page, this.maxPage)
            return
        }
        this.pageInternal = page
        this.fetchList()
    }

    refresh(): void {
        this.fetchList()
    }

    private fetchList(): void {
        this.isLoading = true
        this.errorInternal = ''
        this.itemsInternal = []

        const currentPageToken = this.nextPageTokens[this.pageInternal]
        const listData = this.fetchFunction(this.filterInternal, currentPageToken)

        listData.items.pipe(
            takeUntil(this.destroyed)
        ).subscribe({
            next: (data: Data) => {
                this.itemsInternal.push({
                    data,
                    uiState: this.uiStateFactory ? this.uiStateFactory() : undefined
                })
            },
            error: (error: any) => {
                this.isLoading = false
                this.errorInternal = String(error)
            },
            complete: () => {
                this.isLoading = false
                this.updateNextPageToken(listData.nextPageToken)
            }
        })
    }

    private resetToFirstPage(): void {
        this.pageInternal = 1

        // The nextPageTokens are indexed by page-number. The page-number is
        // 1-based. So the value at index 0 is `undefined`. Page 1 does not
        // have a token, so the value at index 1 is also `undefined`.
        this.nextPageTokens = [undefined, undefined]
    }

    private updateNextPageToken(nextPageToken: Token | undefined): void {
        // Treat the nextPageToken in the fetched data as `undefined`
        // if the number of fetched items is less than the requested
        // page size.
        if (this.itemsInternal.length < this.filterInternal.pageSize) {
            nextPageToken = undefined
        }

        if (this.pageInternal < 1 || this.pageInternal > this.maxPage) {
            console.error('ListController internal page out of bounds:',
                this.pageInternal, this.maxPage)
        } else if (this.pageInternal == this.maxPage) {
            // We are at the last page. So if there is a next-page-token, we
            // need to make room for it in the nextPageTokens array. If there
            // is no next-page-token, then there is nothing to do since we are
            // already on the last page.
            if (nextPageToken) this.nextPageTokens.push(nextPageToken)
        } else {
            // We are on an intermediate page. So there should already be a
            // next-page-token in nextPageTokens. If the list on the backend
            // is stable, the new next-page-token will match what we already
            // have. So in this stable-list case, we don't have to do anything.

            // But if the list on the backend is not stable, then the new
            // next-page-token won't match the next-page-token we already have.
            // If they don't match, it also means that subsequent tokens may
            // not match. So in this unstable-list case, we must replace the
            // next-page-token we already have AND remove all tokens after it.

            // NOTE: if the pagination UI shows buttons for individual pages,
            // then in the unstable-list case it will result in page buttons
            // being dropped. If this UX is not acceptable, the pagination UI
            // should only be previous/next buttons.

            // TODO(deepak-nulu): need a mechanism to compare tokens since they
            // are of a generic type. Until we have such a mechanism, we assume
            // that the backend list is stable and do nothing.
        }
    }

    private itemsInternal: ListItem<Data, UiState>[] = []

    private pageInternal!: number
    private nextPageTokens!: Array<Token | undefined>

    private isLoadingInternal = false
    private errorInternal = ''

    private destroyed = new Subject()
}
