<template>
  <div class="flex flex-row align-center">
    <div class="dropdown-button-container">
      <flat-pickr
        :config="datetimePickerConfig"
        v-model="time"
        :disabled="this.disabled"
        class="main-element"
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
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, PropSync, Vue } from "vue-property-decorator";

import flatPickr from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.css";

import dayjs from "dayjs";

export interface TimeSelectorConfig {}

@Component({
  components: {
    flatPickr
  }
})
export default class TreeWareTimeSelector extends Vue {
  static readonly defaultConfig: TimeSelectorConfig = {};

  @Prop({ default: () => TreeWareTimeSelector.defaultConfig })
  config!: TimeSelectorConfig;

  @PropSync("value") syncedValue!: Date;

  @Prop({ default: false }) disabled!: boolean;

  get time(): Date {
    return this.syncedValue ?? new Date();
  }

  set time(time: Date) {
    const normalizedTime = normalizeTime(time);
    const noChange = String(normalizedTime) === String(this.syncedValue);
    if (noChange) return;
    this.syncedValue = normalizedTime;
  }

  private setNow(): void {
    this.time = new Date();
  }

  private setMinutesAgo(minutes: number): void {
    const newTime = new Date();
    newTime.setMinutes(newTime.getMinutes() - minutes);
    this.time = newTime;
  }

  private setHoursAgo(hours: number): void {
    const newTime = new Date();
    newTime.setHours(newTime.getHours() - hours);
    this.time = newTime;
  }

  private setDaysAgo(days: number): void {
    const newTime = new Date();
    newTime.setDate(newTime.getDate() - days);
    this.time = newTime;
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
