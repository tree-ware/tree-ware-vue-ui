<template>
  <div class="flex flex-row items-center">
    <vs-button
      v-if="!showConfirmation"
      @click="showConfirmation = true"
      :color="config.buttonColor"
      :icon="config.buttonIcon"
      :icon-pack="config.buttonIconPack"
      :size="config.buttonSize"
      :disabled="disabled"
      :class="config.buttonClass"
      >{{ config.buttonLabel }}</vs-button
    >

    <template v-if="showConfirmation">
      <span>Are you sure?</span>
      <vs-button
        @click="showConfirmation = false"
        :size="config.buttonSize"
        class="ml-4"
        >No</vs-button
      >
      <vs-button
        @click="confirm"
        :color="config.buttonColor"
        :icon="config.buttonIcon"
        :icon-pack="config.buttonIconPack"
        :size="config.buttonSize"
        :class="config.buttonClass"
        class="ml-4"
        >{{ config.buttonLabel }}</vs-button
      >
    </template>
  </div>
</template>

<script lang="ts">
import { ConfirmationButtonConfig } from './TreeWareConfirmationButtonInterfaces'

import 'reflect-metadata'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TreeWareConfirmationButton extends Vue {
  @Prop() readonly config!: ConfirmationButtonConfig
  @Prop({ default: false }) readonly disabled!: boolean

  @Emit() confirm() {
    this.showConfirmation = false
  }

  private showConfirmation = false
}
</script>
