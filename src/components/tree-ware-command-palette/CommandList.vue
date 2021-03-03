<template>
  <div>
    <component
      :is="keyManager"
      :trigger-short-key="upArrowShortcut"
      :ignore-input-element="false"
      @key-trigger="upArrowTrigger"
    />
    <component
      :is="keyManager"
      :trigger-short-key="downArrowShortcut"
      :ignore-input-element="false"
      @key-trigger="downArrowTigger"
    />
    <component
      :is="keyManager"
      :trigger-short-key="enterKeyShortcut"
      :ignore-input-element="false"
      @key-trigger="enterKeyTrigger"
    />
    <div
      class="command-list"
      v-if="commandItemDataList && commandItemDataList.length"
    >
      <component
        :is="commandItem"
        v-for="(command, index) in commandItemDataList"
        :selected-item="selectedItem"
        :command-item-content="commandItemContent"
        :command-item-data="command"
        :command-category-map="commandCategoryMap"
        @item-select="itemSelectFromClick($event, index)"
        :key="index"
      />
    </div>
    <component :is="commandNotFound" v-else />
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator'
import {
  CommandItemData,
  CommandCategoryMap,
  KeyShortCut
} from './CommandInterfaces'
import PaletteKeyManager from './PaletteKeyManager'

const KEY_ARROW_UP = 'ArrowUp'
const KEY_ARROW_DOWN = 'ArrowDown'
const KEY_ENTER = 'Enter'

@Component({
  components: {
    PaletteKeyManager
  }
})
export default class CommandList extends Vue {
  @Prop() readonly commandItemDataList!: CommandItemData[]
  @Prop() readonly commandCategoryMap!: CommandCategoryMap
  @Prop({ type: Function }) readonly commandItemContent!: typeof Vue
  @Prop({ type: Function }) readonly commandItem!: typeof Vue
  @Prop({ type: Function }) readonly keyManager!: typeof Vue
  @Prop({ type: Function }) readonly commandNotFound!: typeof Vue

  @Emit() apply(command: CommandItemData) {}

  @Watch('commandItemDataList.length')
  private resetSelectedItem() {
    if (this.commandItemDataList && this.commandItemDataList.length) {
      this.selectedItem = this.commandItemDataList[0]
      this.selectedIndex = 0
    }
  }

  mounted() {
    this.resetSelectedItem()
  }

  private upArrowTrigger(e: KeyboardEvent) {
    e.stopPropagation()
    if (this.selectedIndex > 0) {
      this.selectedIndex--
      this.selectedItem = this.commandItemDataList[this.selectedIndex]
    }
  }

  private downArrowTigger(e: KeyboardEvent) {
    e.stopPropagation()
    if (this.selectedIndex < this.commandItemDataList.length - 1) {
      this.selectedIndex++
      this.selectedItem = this.commandItemDataList[this.selectedIndex]
    }
  }

  private enterKeyTrigger(e: KeyboardEvent) {
    e.stopPropagation()
    if (this.selectedItem) this.apply(this.selectedItem)
  }

  private itemSelectFromClick(command: CommandItemData, index: number) {
    this.selectedItem = command
    this.selectedIndex = index
    if (this.selectedItem) this.apply(this.selectedItem)
  }

  private enterKeyShortcut: KeyShortCut = {
    key: KEY_ENTER
  }

  private upArrowShortcut: KeyShortCut = {
    key: KEY_ARROW_UP
  }

  private downArrowShortcut: KeyShortCut = {
    key: KEY_ARROW_DOWN
  }

  private selectedItem: CommandItemData | null = null
  private selectedIndex = 0
}
</script>
<style lang="scss" scoped>
$border-color: black;

.command-list {
  margin-top: 10px;
  border: 1px solid $border-color;
  max-height: 300px;
  overflow-y: auto;
}
</style>
