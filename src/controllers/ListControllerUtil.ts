import {
    ListData,
    TimeRange,
    UiSelectionState,
} from './ListControllerInterfaces'

import { empty } from 'rxjs'

export function getTimeRange(startMinutesBefore: number = 10): TimeRange {
    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setMinutes(startTime.getMinutes() - startMinutesBefore);

    return {
        startTime,
        endTime
    }
}

export function emptyListData<Data, Token>(): ListData<Data, Token> {
    return {
        items: empty(),
        nextPageToken: undefined
    };
}

export function uiSelectionStateFactory(index: number): UiSelectionState {
    return {
        index,
        selected: false,
        visible: true,
        nestingLevel: 0,
        nestedList: [],
        nestedVisible: false
    }
}
