<template>
  <div class="flex flex-row">
    <span class="self-center">{{ config.pageSizeLabel }}:</span>
    <vs-select
      :options="pageSizeOptions"
      v-model="syncedValue"
      width="70px"
      style="min-width: 70px;"
      :disabled="this.disabled"
      class="self-center ml-4"
    >
      <vs-select-item
        v-for="option in pageSizeOptions"
        :key="option"
        :value="option"
        :text="option"
      />
    </vs-select>
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, PropSync, Vue } from "vue-property-decorator";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200];

export interface PageSizeSelectorConfig {
  pageSizeLabel: string;
}

@Component
export default class TreeWarePageSizeSelector extends Vue {
  static readonly defaultConfig: PageSizeSelectorConfig = {
    pageSizeLabel: "Rows per page"
  };

  @Prop({ default: () => TreeWarePageSizeSelector.defaultConfig })
  config!: PageSizeSelectorConfig;

  @PropSync("value", { type: Number })
  readonly syncedValue!: number;

  @Prop({ default: false }) disabled!: boolean;

  private readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
}
</script>
