<template>
  <div @click="refresh()" class="dropdown-button-container">
    <vs-dropdown class="cursor-pointer">
      <vs-button :icon="getRefreshIcon()" size="large" />
      <vs-dropdown-menu>
        <vs-dropdown-item @click="periodSeconds = 0" class="whitespace-no-wrap text-base">
          <div class="flex flex-row">
            <vs-icon :icon="getOptionIcon(0)" color="secondary" size="1.0rem" class="mr-2 mt-1" />
            <span>Manual refresh</span>
          </div>
        </vs-dropdown-item>

        <vs-dropdown-group vs-label="Auto refresh">
          <vs-dropdown-item
            v-for="(option, index) in autoRefreshOptions"
            :key="index"
            @click="periodSeconds = option.periodSeconds"
            class="whitespace-no-wrap text-base"
          >
            <div class="flex flex-row">
              <vs-icon
                :icon="getOptionIcon(option.periodSeconds)"
                color="secondary"
                size="1.0rem"
                class="mr-2 mt-1"
              />
              <span>{{option.description}}</span>
            </div>
          </vs-dropdown-item>
        </vs-dropdown-group>
      </vs-dropdown-menu>
    </vs-dropdown>
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";

interface RefreshOption {
  description: string;
  periodSeconds: number;
}

@Component
export default class TreeWareRefreshControl extends Vue {
  @Prop({ default: false }) disabled!: boolean;

  @Emit() refresh() {}

  private get periodSeconds(): number {
    return this.periodSecondsInternal;
  }

  private set periodSeconds(newValue: number) {
    if (newValue === 0) {
      if (this.periodSecondsInternal === 0) {
        // Users may choose the manual-refresh option thinking that is the way
        // to trigger a manual refresh. So trigger a refresh if the manual-
        // refresh option is chosen even if it is already selected.
        this.refresh();
      } else {
        // In this case, there is an auto-refresh in progress. So the manual-
        // refresh option is treated as a way to cancel the auto-refresh.
        this.periodSecondsInternal = newValue;
        this.clearTimer();
      }
    } else if (this.periodSecondsInternal !== newValue) {
      this.periodSecondsInternal = newValue;
      this.clearTimer();
      this.timerId = setInterval(this.refresh, newValue * 1000);
    }
  }

  private getRefreshIcon(): string {
    return this.periodSeconds === 0 ? "refresh" : "timer";
  }

  private getOptionIcon(periodSeconds: number): string {
    return this.periodSeconds === periodSeconds ? "check_circle" : "";
  }

  private clearTimer(): void {
    if (this.timerId !== undefined) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  // 0 seconds refresh-period indicates manual-refresh.
  private periodSecondsInternal = 0;

  private timerId?: number;

  private autoRefreshOptions: RefreshOption[] = [
    {
      description: "Every 1 minute",
      periodSeconds: 60
    },
    {
      description: "Every 2 minutes",
      periodSeconds: 120
    },
    {
      description: "Every 5 minutes",
      periodSeconds: 300
    }
  ];
}
</script>
