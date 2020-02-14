<template>
  <span>{{value}}</span>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, Vue } from "vue-property-decorator";

// Vee-Validate requires `v-model` attribute in a component in order to run
// validations. There are times when a label's value needs to be validated.
// This component is a label with a `value` prop for those times.

// This component does not emit `input` required for `v-model` since it is
// not required for validation to be triggered.
@Component
export default class TreeWareLabel extends Vue {
  @Prop({ default: "" }) value!: string;
}
</script>
