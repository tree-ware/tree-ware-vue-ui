<template>
  <div class="flex flex-row">
    <tree-ware-select
      v-model="syncedSelected"
      :options="countries"
      exact-match
      auto-select-on-blur
      :get-display-name="getDisplayName"
      :is-exact-match="isExactMatch"
      class="w-full"
    ></tree-ware-select>
  </div>
</template>

<script lang="ts" src="./TreeWareCountrySelector.ts" />
