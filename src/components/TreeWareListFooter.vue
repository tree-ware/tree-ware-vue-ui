<template>
  <div class="flex flex-row pb-1">
    <tree-ware-page-size-selector
      v-if="config.pagination"
      :config="getPageSizeSelectorConfig()"
      :value="listController.pageSize"
      @update:value="pageSizeChange($event)"
    />
    <span v-if="config.pagination" class="self-center mr-2">.</span>
    <span v-if="config.itemsCount" class="self-center"
      >Showing {{ listController.visibleItems.length }}
      {{ config.itemsCount.itemsName }}</span
    >
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
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'

import { ListControllerUiInterface } from '../controllers/ListControllerInterfaces'
import TreeWarePageSizeSelector, {
  PageSizeSelectorConfig
} from './TreeWarePageSizeSelector.vue'

export interface ItemsCountConfig {
  itemsName: string
}

export interface ListFooterConfig {
  itemsCount: ItemsCountConfig
  pagination: boolean
}

@Component({
  components: {
    TreeWarePageSizeSelector
  }
})
export default class TreeWareListFooter<ValueFilters> extends Vue {
  static readonly defaultConfig: ListFooterConfig = {
    itemsCount: { itemsName: 'rows' },
    pagination: true
  }

  @Prop({
    default: () => TreeWareListFooter.defaultConfig
  })
  config!: ListFooterConfig
  @Prop() listController!: ListControllerUiInterface<ValueFilters>

  private getPageSizeSelectorConfig(): PageSizeSelectorConfig {
    return {
      ...TreeWarePageSizeSelector.defaultConfig,
      postLabel: `${this.config.itemsCount.itemsName} per page`
    }
  }

  private pageSizeChange(pageSize: number) {
    if (this.listController.pageSize !== pageSize) {
      this.listController.pageSizeChanged(pageSize)
      this.$emit('update:pageSize', pageSize)
    }
  }

  private pageChange(page: number) {
    if (this.listController.page !== page) {
      this.listController.pageChanged(page)
    }
  }
}
</script>
