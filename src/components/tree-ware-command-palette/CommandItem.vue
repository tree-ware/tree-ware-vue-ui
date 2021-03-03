<template>
  <div @click="itemSelect(commandItemData)" ref="itemContainer">
    <component
      :is="commandItemContent"
      :command-category-map="commandCategoryMap"
      :command-item-data="commandItemData"
      :is-selected="isSelected"
    />
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Ref, Prop, Emit, Watch } from 'vue-property-decorator'
import { CommandCategoryMap, CommandItemData } from './CommandInterfaces'

@Component
export default class CommandItem extends Vue {
  @Prop() readonly commandItemData!: CommandItemData
  @Prop() readonly selectedItem!: CommandItemData
  @Prop() readonly commandCategoryMap!: CommandCategoryMap
  @Prop({ type: Function }) readonly commandItemContent!: typeof Vue
  @Ref() itemContainer!: HTMLDivElement

  @Emit() itemSelect(command: CommandItemData) {}

  @Watch('selectedItem')
  private selectedItemChanged() {
    if (this.itemContainer && this.isSelected) {
      this.itemContainer.scrollIntoView(false)
    }
  }
  get isSelected(): boolean {
    return this.commandItemData === this.selectedItem
  }
}
</script>
