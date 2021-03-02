<template>
  <div>
    <component
      :is="keyManager"
      :triggerShortKey="paletteTriggerShortKey"
      @key-trigger="paletteTrigger"
    />
    <component
      :is="keyManager"
      :triggerShortKey="escKeyShortcut"
      :ignoreInputElement="false"
      @key-trigger="escTrigger"
    />
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
          :keyManager="keyManager"
          :commandNotFound="commandNotFound"
          @apply="apply"
        />
      </div>
    </component>
  </div>
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
} from './CommandInterfaces'
import TreeWareBasicPopup from './TreeWareBasicPopup.vue'
import CommandItemContent from './CommandItemContent.vue'
import CommandItem from './CommandItem.vue'
import PaletteKeyManager from './PaletteKeyManager'
import CommandNotFound from './CommandNotFound.vue'

const KEY_ESCAPE = 'Escape'

@Component({
  components: {
    PaletteInput,
    PaletteHeaderContent,
    CommandList,
    TreeWareBasicPopup,
    PaletteKeyManager,
    CommandNotFound
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

  // Template for popup component
  @Prop({ default: TreeWareBasicPopup, type: Function })
  readonly popup!: typeof Vue

  // Template for key manager
  @Prop({ default: PaletteKeyManager, type: Function })
  readonly keyManager!: typeof Vue

  // Template for command not found
  @Prop({ default: CommandNotFound, type: Function })
  readonly commandNotFound!: typeof Vue

  @Emit() apply(command: CommandItemData) {
    this.show = false
  }

  private getKeyStateIfOn(configKey: boolean | undefined, eventKey: boolean) {
    return configKey ? eventKey : !eventKey
  }

  private showChange(show: boolean) {
    this.searchString = ''
    this.show = show
  }

  private paletteTrigger(e: KeyboardEvent) {
    e.preventDefault()
    this.showChange(true)
  }

  private escTrigger(e: KeyboardEvent) {
    e.preventDefault()
    this.showChange(false)
  }

  private clickOuterContent() {
    this.showChange(false)
  }

  private get commandFilteredList(): CommandItemData[] {
    return this.commandItemDataList.filter(command =>
      command.description
        .toLowerCase()
        .startsWith(this.searchString.toLowerCase())
    )
  }

  private searchStringChange(value: string) {
    this.searchString = value
  }

  private escKeyShortcut: KeyShortCut = {
    key: KEY_ESCAPE
  }
  private show = false
  private searchString = ''
}
</script>
