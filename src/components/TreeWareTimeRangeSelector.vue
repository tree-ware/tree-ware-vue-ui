<template>
  <div class="flex flex-row align-center">
    <span class="self-center">Start time:</span>
    <tree-ware-time-selector :value.sync="startTime" :disabled="this.disabled" class="ml-2" />

    <span class="self-center ml-4">End time:</span>
    <tree-ware-select
      v-model="endTimeMode"
      :options="endTimeModes"
      :disabled="disabled"
      exact-match
      auto-select-on-blur
      class="self-center ml-2 w-24"
    />
    <tree-ware-time-selector
      v-if="endTimeMode === 'fixed'"
      :value.sync="endTime"
      :disabled="this.disabled"
      class="ml-2"
    />
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Emit, Prop, PropSync, Vue } from "vue-property-decorator";

import TreeWareSelect from "./TreeWareSelect.vue";
import TreeWareTimeSelector from "./TreeWareTimeSelector.vue";
import { TimeRange } from "../controllers/ListControllerInterfaces";

export interface TimeRangeSelectorConfig {}

// TODO(deepak-nulu): validate that start time <= end time.

type EndTimeMode = "now" | "fixed";

@Component({
  components: {
    TreeWareSelect,
    TreeWareTimeSelector
  }
})
export default class TreeWareTimeRangeSelector extends Vue {
  static readonly defaultConfig: TimeRangeSelectorConfig = {};

  @Prop({ default: () => TreeWareTimeRangeSelector.defaultConfig })
  config!: TimeRangeSelectorConfig;

  @PropSync("value", { type: Object }) syncedValue!: TimeRange;

  @Prop({ default: false }) disabled!: boolean;

  get startTime(): Date {
    return this.syncedValue?.startTime ?? new Date();
  }

  set startTime(startTime: Date) {
    const endTime = this.syncedValue.endTime;
    if (this.isEndTimeLessThanStartTime(startTime, endTime)) return;
    this.syncedValue = {
      ...this.syncedValue,
      startTime
    };
  }

  endTimeModes: EndTimeMode[] = ["now", "fixed"];

  get endTimeMode(): EndTimeMode {
    return this.syncedValue?.endTime === undefined ? "now" : "fixed";
  }

  set endTimeMode(mode: EndTimeMode) {
    if (mode === "now") this.endTime = undefined;
    else this.endTime = new Date();
  }

  get endTime(): Date | undefined {
    return this.syncedValue?.endTime ?? new Date();
  }

  set endTime(endTime: Date | undefined) {
    const startTime = this.syncedValue.startTime;
    if (this.isEndTimeLessThanStartTime(startTime, endTime)) return;
    this.syncedValue = {
      ...this.syncedValue,
      endTime
    };
  }

  @Emit("error")
  private isEndTimeLessThanStartTime(startTime: Date, endTime?: Date): boolean {
    endTime = endTime === undefined ? new Date() : endTime;
    return endTime < startTime;
  }

  private readonly datetimePickerConfig = {
    allowInput: true,
    enableTime: true,
    enableSeconds: true
  };
}
</script>
