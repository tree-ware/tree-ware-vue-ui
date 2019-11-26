<template>
  <div class="tree-ware-tabs flex flex-row">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Vue } from "vue-property-decorator";

/** Wraps <router-link> tags to make them look like tabs. */
@Component
export default class TreeWareTabs extends Vue {}
</script>

<style lang="scss" scoped>
$primary-color: lightgray;
$secondary-color: gray;

.tree-ware-tabs {
  a {
    color: $secondary-color;
    padding: 1rem;

    &.router-link-active {
      color: $primary-color;
      cursor: default;
      border-bottom: solid 1px $primary-color;
    }
  }
}
</style>
