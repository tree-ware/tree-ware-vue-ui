<template>
  <div
    class="item"
    @click="itemSelect(commandItemData)"
    :class="{ 'bg-primary': isSelected }"
  >
    <div class="category">
      <vs-chip color="warning">
        Category
      </vs-chip>
    </div>
    <div class="label">
      <span>{{ commandItemData.description }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Ref, Prop, Emit } from 'vue-property-decorator'
import CommandItemData from './CommandItemData'

@Component
export default class CommandItem extends Vue {
  @Prop() readonly commandItemData!: CommandItemData
  @Prop() readonly selectedItem!: CommandItemData
  @Emit() itemSelect(command: CommandItemData) {}
  get isSelected(): boolean {
    return this.commandItemData === this.selectedItem
  }
}
</script>
<style lang="scss" scoped>
.item {
  display: flex;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 5px;
  border-bottom: 2px solid black;
  cursor: pointer;
  .category {
    font-size: 10px !important;
  }
  .label {
    padding-top: 2px;
    padding-left: 8px;
  }
}
</style>
