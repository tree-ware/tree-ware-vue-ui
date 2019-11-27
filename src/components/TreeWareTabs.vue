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
$active-tab-background-color: gray;
$active-tab-text-color: white;
$border-color: lightgray;
$border-radius: 0.75rem;
$border-width: 1px;
$inactive-tab-background-color: white;
$inactive-tab-text-color: gray;
$tab-margin-x: 2px;
$tab-padding-x: 2rem;
$tab-padding-y: 0.75rem;

.tree-ware-tabs {
  border-bottom: solid $border-width $border-color;

  a {
    background-color: $inactive-tab-background-color;
    border: solid $border-width $border-color;
    border-bottom: none;
    border-radius: $border-radius $border-radius 0 0;
    color: $inactive-tab-text-color;
    padding: $tab-padding-y $tab-padding-x;
    margin: 0px $tab-margin-x;

    &:hover {
      background-color: lighten($active-tab-background-color, 10%);
      color: $active-tab-text-color;
    }

    &.router-link-active {
      background-color: $active-tab-background-color;
      color: $active-tab-text-color;
      cursor: default;
    }
  }
}
</style>
