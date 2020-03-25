// WARNING: this class changes state during rendering.
// To prevent an infinite rendering loop, make sure an instance of this class
// is NOT a reactive property. So when using @Component decorator with a
// TypeScript class, initialize the `listGroupingController` property to
// `undefined` and set the property to an instance of this class in the
// `beforeMount()` method. This way, the `listGroupingController` will not be
// a reactive property and state-changes during rendering will be ignored.

// Groups consecutive items while rendering a list.
export class ListGroupingController<GroupingValue> {
    constructor(private groups: string[]) {
        this.groupCount = groups.length
    }

    getGroup(elementIndex: number, currentValue: GroupingValue): string {
        if (elementIndex === 0) {
            this.groupIndex = 0
            this.previousValue = currentValue
        } else if (currentValue !== this.previousValue) {
            this.groupIndex = (this.groupIndex + 1) % this.groupCount
            this.previousValue = currentValue
        }
        return this.groups[this.groupIndex]
    }

    private groupCount: number;
    private groupIndex = 0
    private previousValue?: GroupingValue = undefined
}
