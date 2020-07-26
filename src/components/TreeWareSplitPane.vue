<template>
  <div class="tree-ware-split-pane flex flex-row">
    <div v-if="hasFirst" :class="firstClasses">
      <slot name="first"></slot>
    </div>
    <div v-if="hasSecond" :class="secondClasses">
      <slot name="second"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import 'reflect-metadata'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TreeWareSplitPane extends Vue {
  @Prop({ default: false }) readonly hasFirst!: boolean
  @Prop({ default: false }) readonly hasSecond!: boolean

  @Prop({ default: '' }) readonly firstClasses!: string
  @Prop({ default: '' }) readonly secondClasses!: string
}
</script>
