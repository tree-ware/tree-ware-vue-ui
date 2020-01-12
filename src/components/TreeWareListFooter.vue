<template>
  <div class="flex flex-row pb-1">
    <span
      v-if="config.itemsCount"
      class="self-center"
    >Displaying {{listController.items.length}} {{config.itemsCount.itemsName}}</span>
    <vs-pagination
      v-if="config.pagination"
      :total="listController.maxPage"
      :value="listController.page"
      @input="pageChange"
      :disabled="listController.isLoading"
      class="ml-auto"
    />
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, Vue } from "vue-property-decorator";

import { ListControllerUiInterface } from "../controllers/ListControllerTypes";

export interface ItemsCountConfig {
  itemsName: string;
}

export interface ListFooterConfig {
  itemsCount?: ItemsCountConfig;
  pagination: boolean;
}

@Component
export default class TreeWareListFooter<ValueFilters> extends Vue {
  static readonly defaultConfig: ListFooterConfig = {
    pagination: true
  };

  @Prop({
    default: () => TreeWareListFooter.defaultConfig
  })
  config!: ListFooterConfig;
  @Prop() listController!: ListControllerUiInterface<ValueFilters>;

  private pageChange(page: number) {
    if (this.listController.page !== page) {
      this.listController.pageChanged(page);
    }
  }
}
</script>
