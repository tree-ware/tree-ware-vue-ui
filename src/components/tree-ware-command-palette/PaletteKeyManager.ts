import 'reflect-metadata'
import { CreateElement, VNode } from 'vue'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'
import { KeyShortCut } from './CommandInterfaces'

const ELEMENT_INPUT = 'INPUT'

export enum KeyEvent {
  KEYUP = 'keyup',
  KEYDOWN = 'keydown',
  KEYPRESS = 'keypress'
}

@Component
export default class PaletteKeyManager extends Vue {
  // TODO(hk) : Support multiple key shortcuts in single instance
  @Prop() readonly triggerShortKey!: KeyShortCut | undefined
  @Prop({ default: true }) readonly ignoreInputElement!: boolean
  @Prop({ default: KeyEvent.KEYDOWN, type: String })
  readonly keyEvent!: KeyEvent

  private getKeyStateIfOn(configKey: boolean | undefined, eventKey: boolean) {
    return configKey ? eventKey : !eventKey
  }

  @Emit() keyTrigger(e: KeyboardEvent) {}

  render(h: CreateElement): VNode {
    return h()
  }

  mounted() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (
        this.ignoreInputElement &&
        (e.target as HTMLElement).tagName === ELEMENT_INPUT
      ) {
        return
      }
      if (this.triggerShortKey) {
        if (e.key.toLowerCase() === this.triggerShortKey.key.toLowerCase()) {
          const shiftKey = this.getKeyStateIfOn(
            this.triggerShortKey.shiftKey,
            e.shiftKey
          )
          const altKey = this.getKeyStateIfOn(
            this.triggerShortKey.altKey,
            e.altKey
          )
          const ctrlKey = this.getKeyStateIfOn(
            this.triggerShortKey.ctrlKey,
            e.ctrlKey
          )
          const metaKey = this.getKeyStateIfOn(
            this.triggerShortKey.metaKey,
            e.metaKey
          )
          if (shiftKey && altKey && ctrlKey && metaKey) {
            this.keyTrigger(e)
          }
        }
      } else {
        this.keyTrigger(e)
      }
    }
    window.addEventListener(this.keyEvent, this.handleKeyDown)
  }

  beforeDestroy() {
    window.removeEventListener(this.keyEvent, this.handleKeyDown)
  }

  private handleKeyDown = (e: KeyboardEvent) => {}
}
