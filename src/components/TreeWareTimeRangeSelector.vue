<template>
  <div class="flex flex-row align-center">
    <span class="self-center">Start time:</span>
    <div class="dropdown-button-container">
      <flat-pickr
        :config="datetimePickerConfig"
        v-model="startTime"
        :disabled="this.disabled"
        class="main-element ml-4"
      />
      <vs-dropdown :disabled="this.disabled">
        <vs-button type="filled" icon="expand_more" :disabled="this.disabled" class="btn-drop"></vs-button>
        <vs-dropdown-menu>
          <vs-dropdown-item @click="setNow()">Now</vs-dropdown-item>

          <vs-dropdown-group vs-label="Minutes">
            <vs-dropdown-item @click="setMinutesAgo(10)">10 minutes ago</vs-dropdown-item>
            <vs-dropdown-item @click="setMinutesAgo(20)">20 minutes ago</vs-dropdown-item>
            <vs-dropdown-item @click="setMinutesAgo(40)">40 minutes ago</vs-dropdown-item>
          </vs-dropdown-group>

          <vs-dropdown-group vs-label="Hours">
            <vs-dropdown-item @click="setHoursAgo(1)">1 hour ago</vs-dropdown-item>
            <vs-dropdown-item @click="setHoursAgo(2)">2 hours ago</vs-dropdown-item>
            <vs-dropdown-item @click="setHoursAgo(4)">4 hours ago</vs-dropdown-item>
            <vs-dropdown-item @click="setHoursAgo(8)">8 hours ago</vs-dropdown-item>
            <vs-dropdown-item @click="setHoursAgo(16)">16 hours ago</vs-dropdown-item>
          </vs-dropdown-group>

          <vs-dropdown-group vs-label="Days">
            <vs-dropdown-item @click="setDaysAgo(1)">1 day ago</vs-dropdown-item>
            <vs-dropdown-item @click="setDaysAgo(2)">2 days ago</vs-dropdown-item>
            <vs-dropdown-item @click="setDaysAgo(4)">4 days ago</vs-dropdown-item>
            <vs-dropdown-item @click="setDaysAgo(7)">7 days ago</vs-dropdown-item>
          </vs-dropdown-group>
        </vs-dropdown-menu>
      </vs-dropdown>
    </div>

    <!--
    <span class="ml-4">End time:</span>
    <flat-pickr class="ml-4" :config="datetimePickerConfig" v-model="endTime" />
    -->
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, PropSync, Vue } from "vue-property-decorator";

import flatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.css";

import dayjs from "dayjs";

import { TimeRange } from "../controllers/ListControllerTypes";

export interface TimeRangeSelectorConfig {}

// TODO(deepak-nulu): Re-enable end-time.
// TODO(deepak-nulu): validate that start time <= end time.

@Component({
  components: {
    flatPickr
  }
})
export default class TreeWareTimeRangeSelector extends Vue {
  static readonly defaultConfig: TimeRangeSelectorConfig = {};

  @Prop({ default: () => TreeWareTimeRangeSelector.defaultConfig })
  config!: TimeRangeSelectorConfig;

  @PropSync("value", { type: Object }) syncedValue!: TimeRange;

  @Prop({ default: false }) disabled!: boolean;

  get startTime(): Date {
    return this.syncedValue.startTime;
  }

  set startTime(time: Date) {
    const normalizedTime = normalizeTime(time);
    const noChange =
      String(normalizedTime) === String(this.syncedValue.startTime);
    if (noChange) return;
    this.syncedValue = {
      ...this.syncedValue,
      startTime: normalizedTime
    };
  }

  // TODO(deepak-nulu): move into its own component when end-time is re-enabled
  // so it can be reused.
  private setNow(): void {
    this.startTime = new Date();
  }

  // TODO(deepak-nulu): move into its own component when end-time is re-enabled
  // so it can be reused.
  private setMinutesAgo(minutes: number): void {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);
    this.startTime = startTime;
  }

  // TODO(deepak-nulu): move into its own component when end-time is re-enabled
  // so it can be reused.
  private setHoursAgo(hours: number): void {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    this.startTime = startTime;
  }

  // TODO(deepak-nulu): move into its own component when end-time is re-enabled
  // so it can be reused.
  private setDaysAgo(days: number): void {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);
    this.startTime = startTime;
  }

  private readonly datetimePickerConfig = {
    allowInput: true,
    enableTime: true,
    enableSeconds: true
  };
}

function normalizeTime(time: Date): Date {
  // The date/time component sets the time as a string.
  return typeof time === "string" ? dayjs(time).toDate() : time;
}
</script>

<style scoped>
button >>> i.vs-icon {
  margin-top: -3px !important;
}
</style>