import {
    ListControllerUiInterface,
    ListFetchFunction,
    ListFilter,
    ListItem,
    NestedList,
    UiSelectionState,
    UiStateFactory,
} from './ListControllerInterfaces'

import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

export class ListController<ValueFilters, Data extends object, Token, UiState extends UiSelectionState>
    implements ListControllerUiInterface<ValueFilters>
{
    constructor(
        private filterInternal: ListFilter<ValueFilters>,
        private readonly fetchFunction: ListFetchFunction<ValueFilters, Data, Token>,
        private readonly uiStateFactory: UiStateFactory<Data, UiState>,
        private readonly dataIsNested: boolean = false,
        private readonly selectNestedIfHidden: boolean = false
    ) {
        this.resetToFirstPage()
    }

    setIsLoadingCallback(callback: (loading: boolean) => void): this {
        this.isLoadingCallback = callback
        return this
    }

    setIsAllSelectedCallback(callback: (allSelected: boolean | undefined) => void): this {
        this.isAllSelectedCallback = callback
        return this
    }

    destroy(): void {
        this.destroyed.next()
        this.destroyed.complete()
    }

    get filter(): ListFilter<ValueFilters> {
        return this.filterInternal
    }

    get pageSize(): number {
        return this.filterInternal.pageSize
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
    private setIsLoading(loading: boolean): void {
        this.isLoadingInternal = loading
        if (this.isLoadingCallback) this.isLoadingCallback(loading)
    }

    get error(): string {
        return this.errorInternal
    }
    set error(value: string) {
        this.errorInternal = value
    }

    get selectionCount(): Observable<number> {
        return this.selectionCount$
    }
    private setSelectionCount(count: number): void {
        this.selectionCount$.next(count)
    }
    private changeSelectionCount(delta: number): void {
        const current = this.selectionCount$.getValue()
        this.selectionCount$.next(current + delta)
    }
    private recomputeSelectionCount(): void {
        let count = this.itemsInternal
            .filter(item => (this.selectNestedIfHidden || item.uiState.visible) && item.uiState.selected)
            .length
        this.setSelectionCount(count)
    }

    /**
     * Indicates if all, none, or some items are selected.
     * Returns true if all items are selected,
     *         false if none of the items are selected,
     *         undefined if some are selected and others are not
     */
    get isAllSelected(): boolean | undefined {
        return this.isAllSelectedInternal
    }
    private setIsAllSelected(allSelected: boolean | undefined): void {
        this.isAllSelectedInternal = allSelected
        if (this.isAllSelectedCallback) this.isAllSelectedCallback(allSelected)
    }
    private recomputeIsAllSelected(): void {
        const currentSelectionCount = this.selectionCount$.getValue()
        const totalLength = this.selectNestedIfHidden
            ? this.itemsInternal.length
            : this.itemsInternal.filter(item => item.uiState.visible).length
        this.setIsAllSelected(currentSelectionCount === 0
            ? false
            : currentSelectionCount === totalLength ? true : undefined
        )
    }

    toggleAllSelected(): void {
        const allSelected = !this.isAllSelectedInternal
        let selectionCount = 0
        this.itemsInternal.forEach(item => {
            if (this.selectNestedIfHidden || item.uiState.visible) {
                item.uiState.selected = allSelected
                ++selectionCount
            }
        })
        this.setSelectionCount(allSelected ? selectionCount : 0)
        this.setIsAllSelected(allSelected)
    }

    toggleSelected(uiState: UiState): void {
        uiState.selected = !uiState.selected
        this.changeSelectionCount(uiState.selected ? +1 : -1)
        this.recomputeIsAllSelected()
    }

    toggleNested(uiState: UiState): void {
        uiState.nestedVisible = !uiState.nestedVisible
        // Toggle visibility of nested items
        uiState.nestedList.forEach(nested => {
            nested.visible = !nested.visible
        })
        this.recomputeSelectionCount()
        this.recomputeIsAllSelected()
    }

    get items(): ListItem<Data, UiState>[] {
        return this.itemsInternal
    }

    get visibleItems(): ListItem<Data, UiState>[] {
        return this.itemsInternal.filter(item => item.uiState.visible)
    }

    get selectedItems(): ListItem<Data, UiState>[] {
        return this.itemsInternal.filter(item => item.uiState.selected)
    }

    get visibleSelectedItems(): ListItem<Data, UiState>[] {
        return this.itemsInternal.filter(item => item.uiState.visible && item.uiState.selected)
    }

    filterChanged(filter: ListFilter<ValueFilters>): void {
        this.filterInternal = filter
        this.resetToFirstPage()
        this.fetchList()
    }

    pageSizeChanged(pageSize: number): void {
        this.filterInternal.pageSize = pageSize
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
        this.setIsLoading(true)
        this.errorInternal = ''
        this.setSelectionCount(0)
        this.setIsAllSelected(false)
        this.itemsInternal = []

        const currentPageToken = this.nextPageTokens[this.pageInternal]
        const listData = this.fetchFunction(this.filterInternal, currentPageToken)

        let index = 0
        listData.items.pipe(
            takeUntil(this.destroyed)
        ).subscribe({
            next: (data: Data) => {
                const uiState = this.uiStateFactory(index++, data)
                this.itemsInternal.push({ data, uiState })
                if (!this.dataIsNested) return

                const nestedList = (data as NestedList<Data>).nestedList
                if (nestedList.length == 0) return

                nestedList.forEach(nested => {
                    const nestedUiState = this.uiStateFactory(index++, nested)
                    nestedUiState.nestingLevel = 1
                    nestedUiState.visible = false
                    uiState.nestedList.push(nestedUiState)
                    this.itemsInternal.push({ data: nested, uiState: nestedUiState })
                })
            },
            error: (error: any) => {
                this.setIsLoading(false)
                this.errorInternal = String(error)
            },
            complete: () => {
                this.setIsLoading(false)
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

    private selectionCount$ = new BehaviorSubject(0)
    private isAllSelectedInternal: boolean | undefined = undefined

    private isLoadingCallback?: (loading: boolean) => void = undefined
    private isAllSelectedCallback?: (allSelected: boolean | undefined) => void = undefined

    private destroyed = new Subject()
}
