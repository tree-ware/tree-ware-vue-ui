<template>
  <component
    :is="popup"
    :popupWidth="popupWidth"
    :topOffSetInPercentage="topOffSetInPercentage"
    :lengthUnit="lengthUnit"
    :show="show"
    :fullScreen="fullScreen"
    @click-outer-content="clickOuterContent"
  >
    <div class="content-container">
      <component :is="paletteHeaderContent" />
      <component :is="paletteInput" @change="searchStringChange" />
      <component
        :is="commandList"
        :commandItem="commandItem"
        :commandItemContent="commandItemContent"
        :commandItemDataList="commandFilteredList"
        :commandCategoryMap="commandCategoryMap"
        @apply="apply"
      />
    </div>
  </component>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Prop, Emit } from 'vue-property-decorator'
import PaletteInput from './PaletteInput.vue'
import PaletteHeaderContent from './PaletteHeaderContent.vue'
import CommandList from './CommandList.vue'
import {
  CommandCategoryMap,
  CommandItemData,
  KeyShortCut
} from './CommandItemData'
import TreeWareBasicPopup from './TreeWareBasicPopup.vue'
import CommandItemContent from './CommandItemContent.vue'
import CommandItem from './CommandItem.vue'

const ELEMENT_INPUT = 'INPUT'
const KEY_ESCAPE = 'Escape'

@Component({
  components: {
    PaletteInput,
    PaletteHeaderContent,
    CommandList,
    TreeWareBasicPopup
  }
})
export default class TreeWareCommandPalette extends Vue {
  @Prop() readonly commandItemDataList!: CommandItemData[]
  @Prop() readonly commandCategoryMap!: CommandCategoryMap
  @Prop({ default: 500 }) readonly popupWidth!: number
  @Prop({ default: '30%' }) readonly topOffSetInPercentage!: string
  @Prop({ default: 'px' }) readonly lengthUnit!: string
  @Prop({ default: false }) readonly fullScreen!: boolean
  @Prop() readonly paletteTriggerShortKey!: KeyShortCut

  // Template for command item content
  @Prop({ default: CommandItemContent, type: Function })
  readonly commandItemContent!: typeof Vue

  // Template for palette header
  @Prop({ default: PaletteHeaderContent, type: Function })
  readonly paletteHeaderContent!: typeof Vue

  // Template for palette input
  @Prop({ default: PaletteInput, type: Function })
  readonly paletteInput!: typeof Vue

  // Template for command list
  @Prop({ default: CommandList, type: Function })
  readonly commandList!: typeof Vue

  // Template for command item
  @Prop({ default: CommandItem, type: Function })
  readonly commandItem!: typeof Vue

  //Template for popup component
  @Prop({ default: TreeWareBasicPopup, type: Function })
  readonly popup!: typeof Vue

  @Emit() apply(command: CommandItemData) {
    this.show = false
  }

  private getKeyStateIfOn(configKey: boolean | undefined, eventKey: boolean) {
    return configKey ? eventKey : !eventKey
  }

  mounted() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEY_ESCAPE) {
        this.show = false
      } else if ((e.target as HTMLElement).tagName !== ELEMENT_INPUT) {
        if (this.paletteTriggerShortKey) {
          e.preventDefault()
          if (
            e.key.toLowerCase() ===
              this.paletteTriggerShortKey.key.toLowerCase() &&
            !this.show
          ) {
            const shiftKey = this.getKeyStateIfOn(
              this.paletteTriggerShortKey.shiftKey,
              e.shiftKey
            )
            const altKey = this.getKeyStateIfOn(
              this.paletteTriggerShortKey.altKey,
              e.altKey
            )
            const ctrlKey = this.getKeyStateIfOn(
              this.paletteTriggerShortKey.ctrlKey,
              e.ctrlKey
            )
            const metaKey = this.getKeyStateIfOn(
              this.paletteTriggerShortKey.metaKey,
              e.metaKey
            )
            this.show = shiftKey && altKey && ctrlKey && metaKey
          }
        } else {
          this.show = true
        }
      }
    }
    window.addEventListener('keydown', this.handleKeyDown)
  }

  beforeUnmount() {
    this.show = false
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  private clickOuterContent() {
    this.show = false
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
}
</script>
