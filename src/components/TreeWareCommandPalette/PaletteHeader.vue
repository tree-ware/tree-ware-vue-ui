<template>
  <div class="guide">
    Search for a command
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Ref } from 'vue-property-decorator'

@Component
export default class PaletteHeader extends Vue {}
</script>
<style lang="scss" scoped>
.guide {
  width: auto;
  padding-top: 5px;
  padding-bottom: 5px;
  font-size: 11px;
}
</style>
