<template>
  <div class="item-content" :class="{ selected: isSelected }">
    <div class="category" v-if="commandItemData.category !== undefined">
      <vs-chip :color="commandCategoryMap[commandItemData.category].color">
        {{ commandCategoryMap[commandItemData.category].name }}
      </vs-chip>
    </div>
    <div class="label">
      <span>{{ commandItemData.description }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Ref, Prop, Emit, Watch } from 'vue-property-decorator'
import { CommandCategoryMap, CommandItemData } from './CommandInterfaces'

@Component
export default class CommandItemContent extends Vue {
  @Prop() readonly commandItemData!: CommandItemData
  @Prop() readonly isSelected!: boolean
  @Prop() readonly commandCategoryMap!: CommandCategoryMap
}
</script>
<style lang="scss" scoped>
$border-color: black;
$background-color: rgba(var(--vs-primary), 1);

.item-content {
  display: flex;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 5px;
  border-bottom: 2px solid $border-color;
  cursor: pointer;

  .category {
    font-size: 10px !important;
  }
  .label {
    padding-top: 2px;
    padding-left: 8px;
  }

  &.selected {
    background-color: $background-color;
  }
}
</style>
