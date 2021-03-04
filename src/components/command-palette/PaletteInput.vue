<template>
  <vs-input
    ref="input"
    v-model="value"
    class="palette-input"
    color="dark"
    @input="change(value)"
    placeholder="Type a command"
  />
</template>

<script lang="ts">
import { Component, Vue, Ref, Emit } from 'vue-property-decorator'

@Component
export default class PaletteInput extends Vue {
  @Ref() readonly input!: Vue
  @Emit() change(value: string) {}

  mounted() {
    if (this.input.$refs.vsinput) {
      ;(this.input.$refs.vsinput as HTMLElement).focus()
    }
  }
  private value = ''
}
</script>
<style lang="scss" scoped>
.palette-input {
  width: auto;
}
</style>
