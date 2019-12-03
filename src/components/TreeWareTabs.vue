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
  position: relative;

  // Inset bottom-border so that the active-tab's bottom-border can hide it.
  &:before {
    border-bottom: solid $border-width $border-color;
    bottom: 0px;
    color: transparent; // hide the content specified below
    content: "invisible content"; // it won't work in Chrome without this
    left: 0px;
    position: absolute;
    right: 0px;
    top: 0px;
    z-index: -1;
  }

  a {
    background-color: $inactive-tab-background-color;
    border: solid $border-width $border-color;
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
      border-bottom: none;
      color: $active-tab-text-color;
      cursor: default;
    }
  }
}
</style>
