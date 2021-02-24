<template>
  <div>
    <div
      class="command-list"
      v-if="commandItemDataList && commandItemDataList.length"
    >
      <command-item
        v-for="(command, index) in commandItemDataList"
        :selectedItem="selectedItem"
        :commandItemData="command"
        :commandCategoryMap="commandCategoryMap"
        @item-select="itemSelectFromClick($event, index)"
        :key="index"
      />
    </div>
    <div v-else>
      Command not found
    </div>
  </div>
</template>

<script lang="ts">
import { keys } from 'd3'
import 'reflect-metadata'
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator'
import CommandItem from './CommandItem.vue'
import { CommandItemData, CommandCategoryMap } from './CommandItemData'

const KEY_ARROW_UP = 'ArrowUp'
const KEY_ARROW_DOWN = 'ArrowDown'
const KEY_ENTER = 'Enter'

@Component({
  components: {
    CommandItem
  }
})
export default class CommandList extends Vue {
  @Prop() readonly commandItemDataList!: CommandItemData[]
  @Prop() readonly commandCategoryMap!: CommandCategoryMap

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
    this.handleKeyDown = e => {
      e.stopPropagation()
      if (e.key === KEY_ARROW_DOWN) {
        if (this.selectedIndex < this.commandItemDataList.length - 1) {
          this.selectedIndex++
          this.selectedItem = this.commandItemDataList[this.selectedIndex]
        }
      } else if (e.key === KEY_ARROW_UP) {
        if (this.selectedIndex > 0) {
          this.selectedIndex--
          this.selectedItem = this.commandItemDataList[this.selectedIndex]
        }
      } else if (e.key === KEY_ENTER) {
        if (this.selectedItem) this.apply(this.selectedItem)
      }
    }
    window.addEventListener('keydown', this.handleKeyDown)
  }

  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  private itemSelectFromClick(command: CommandItemData, index: number) {
    this.selectedItem = command
    this.selectedIndex = index
    if (this.selectedItem) this.apply(this.selectedItem)
  }

  private selectedItem: CommandItemData | null = null
  private selectedIndex = 0
  private handleKeyDown = (e: KeyboardEvent) => {}
}
</script>
<style lang="scss" scoped>
.command-list {
  margin-top: 10px;
  border: 1px solid black;
  max-height: 300px;
  overflow-y: auto;
}
</style>
