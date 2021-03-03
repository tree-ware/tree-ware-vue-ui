<template>
  <div class="command-not-found">
    Command not found
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class CommandNotFound extends Vue {}
</script>
<style lang="scss" scoped>
.command-not-found {
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 5px;
}
</style>
