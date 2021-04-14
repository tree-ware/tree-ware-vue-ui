<template>
  <img
    v-if="isFile"
    :src="imageData.content"
    :alt="imageData.description"
    :class="imageData.classes"
  />
  <div v-else :aria-label="imageData.description" :class="imageData.classes">
    {{ imageData.content }}
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { TreeWareImageData } from './TreeWareImageInterfaces'
import { TreeWareImageType } from './TreeWareImageTypes'

@Component
export default class TreeWareImage extends Vue {
  @Prop() readonly imageData!: TreeWareImageData

  private get isFile(): boolean {
    return this.imageData.type === TreeWareImageType.FILE
  }
}
</script>
