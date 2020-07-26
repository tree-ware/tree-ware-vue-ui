<template>
  <div>
    <vs-button
      v-if="!showConfirmation"
      @click="showConfirmation = true"
      :color="config.buttonColor"
      :icon="config.buttonIcon"
      :icon-pack="config.buttonIconPack"
      :class="config.buttonClass"
      >{{ config.buttonLabel }}</vs-button
    >

    <template v-if="showConfirmation">
      <span>Are you sure?</span>
      <vs-button @click="showConfirmation = false" class="ml-4">No</vs-button>
      <vs-button
        @click="confirm"
        :color="config.buttonColor"
        :icon="config.buttonIcon"
        :icon-pack="config.buttonIconPack"
        :class="config.buttonClass"
        class="ml-4"
        >{{ config.buttonLabel }}</vs-button
      >
    </template>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Emit, Prop, Vue } from 'vue-property-decorator'

export interface ConfirmationButtonConfig {
  buttonLabel: string
  buttonColor?: string
  buttonIcon?: string
  buttonIconPack?: string
  buttonClass?: string
}

@Component
export default class TreeWareConfirmationButton extends Vue {
  @Prop() readonly config!: ConfirmationButtonConfig

  @Emit() confirm() {
    this.showConfirmation = false
  }

  private showConfirmation = false
}
</script>
