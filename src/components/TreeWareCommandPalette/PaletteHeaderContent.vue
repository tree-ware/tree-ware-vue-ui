<template>
  <div class="guide">
    <div class="search_command">Search for a command</div>
    <div class="flex">
      <div class="mr-5">
        <div class="updown_guide">
          <vs-icon icon="import_export"> </vs-icon>
        </div>
        <span class="updown_label">to navigate</span>
      </div>
      <div class="mr-5">
        <div class="key_guide">enter</div>
        <span>to select</span>
      </div>
      <div class="mr-5">
        <div class="key_guide">esc</div>
        <span>to dismiss</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Vue, Ref } from 'vue-property-decorator'

@Component
export default class PaletteHeaderContent extends Vue {}
</script>
<style lang="scss" scoped>
$background-color: black;
.guide {
  display: flex;
  width: auto;
  padding-top: 5px;
  padding-bottom: 5px;
  font-size: 11px;

  .search_command {
    display: inline-block;
    margin-right: 35px;
  }

  .updown_guide {
    display: inline-block;
    background-color: $background-color;
    margin-right: 4px;
  }
  .updown_label {
    bottom: 3px;
    position: relative;
  }
  .key_guide {
    display: inline-block;
    background-color: $background-color;
    padding-left: 2px;
    border-radius: 4px;
    padding-right: 2px;
    margin-right: 4px;
  }
}
</style>
