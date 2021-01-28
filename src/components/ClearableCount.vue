<template>
  <div class="flex flex-row items-center">
    <span class="mr-2">{{ label }}:</span>
    <vs-chip
      v-if="count > 0"
      @click="clear"
      closable
      color="warning"
      class="whitespace-no-wrap text-base mb-0"
    >
      {{ count }}
    </vs-chip>
    <span v-else>0</span>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ClearableCount extends Vue {
  @Prop() readonly label!: string
  @Prop() readonly count!: number
  @Emit() clear() {}
}
</script>
