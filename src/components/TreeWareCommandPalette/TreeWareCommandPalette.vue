<template>
  <tree-ware-basic-popup :show="show">
    <div>
      <palette-header />
      <palette-input @change="searchStringChange" />
      <command-list
        :commandItemDataList="commandFilteredList"
        :commandCategoryMap="commandCategoryMap"
        @apply="apply"
      />
    </div>
  </tree-ware-basic-popup>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import PaletteInput from './PaletteInput.vue'
import PaletteHeader from './PaletteHeader.vue'
import CommandList from './CommandList.vue'
import { CommandCategoryMap, CommandItemData } from './CommandItemData'
import TreeWareBasicPopup from './TreeWareBasicPopup.vue'

const ELEMENT_INPUT = 'INPUT'
const KEY_ESCAPE = 'Escape'

@Component({
  components: {
    PaletteInput,
    PaletteHeader,
    CommandList,
    TreeWareBasicPopup
  }
})
export default class TreeWareCommandPalette extends Vue {
  @Prop() readonly commandItemDataList!: CommandItemData[]
  @Prop() readonly commandCategoryMap!: CommandCategoryMap

  @Emit() apply(command: CommandItemData) {
    this.show = false
  }

  mounted() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEY_ESCAPE) {
        this.show = false
      } else if ((e.target as HTMLElement).tagName !== ELEMENT_INPUT) {
        this.show = true
      }
    }
    this.handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).className === 'palette-popup') {
        this.show = false
      }
    }
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('click', this.handleClick)
  }

  beforeUnmount() {
    this.show = false
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('click', this.handleClick)
  }

  private get commandFilteredList(): CommandItemData[] {
    return this.commandItemDataList.filter(command =>
      command.description.startsWith(this.searchString)
    )
  }

  private searchStringChange(value: string) {
    this.searchString = value
  }

  private searchString = ''

  private show = false
  private handleKeyDown = (e: KeyboardEvent) => {}
  private handleClick = (e: MouseEvent) => {}
}
</script>
