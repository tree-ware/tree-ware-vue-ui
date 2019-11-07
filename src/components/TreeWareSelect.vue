<template>
  <div class="tree-ware-select" :class="{'options-visible': showOptions}">
    <input
      ref="inputField"
      type="text"
      v-model="searchText"
      @input="searchTextChanged"
      @click="inputFocussed()"
      @focus="inputFocussed()"
      @blur="inputBlurred()"
      @keydown.down="highlightDown()"
      @keydown.up="highlightUp()"
      @keydown.enter="handleInputEnter()"
    />
    <table class="tree-ware-select-options">
      <tr
        v-for="(option, index) in matchingOptions"
        :key="getDisplayName(option)"
        @mousedown.prevent
        @click="optionSelected(option)"
        class="tree-ware-select-option-row"
        :class="{'highlight': index === highlightIndex}"
      >
        <!-- TODO(deepaknulu): selection indicator -->
        <td v-if="getFrequencyCount === undefined" class="selection-indicator">&nbsp;</td>
        <td
          v-if="getFrequencyCount !== undefined"
          class="frequency-count"
        >{{getFrequencyCount(option)}}</td>
        <td class="display-name">{{getDisplayName(option)}}</td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import {
  Component,
  Prop,
  PropSync,
  Ref,
  Vue,
  Watch
} from "vue-property-decorator";

export type GetDisplayNameFunction = (option: Object | String) => string;
export type GetFrequencyCountFunction = (option: Object) => number;
export type MatchFunction = (
  searchText: string,
  option: Object | String
) => boolean;
export type CreateOptionFunction = (input: string) => Object | String;

@Component
export default class TreeWareSelect extends Vue {
  // TODO(deepaknulu): implement exactMatch = false functionality.
  @Prop({ default: false }) readonly exactMatch!: boolean;

  /** Auto-selects first option. Applicable only if exactMatch is true. */
  @Prop({ default: false }) readonly autoSelectOnBlur!: boolean;

  @PropSync("value", { type: [Object, String] }) syncedValue!: Object | String;
  @Prop({ default: () => [] }) readonly options!: Array<Object | String>;

  @Prop({ default: defaultGetDisplayName })
  readonly getDisplayName!: GetDisplayNameFunction;

  @Prop() readonly getFrequencyCount?: GetFrequencyCountFunction;

  @Prop({ default: defaultIsExactMatch }) readonly isExactMatch!: MatchFunction;
  @Prop({ default: defaultIsMatch }) readonly isMatch!: MatchFunction;

  /** A function to create an option object from a user's input string */
  @Prop({ default: defaultCreateOption })
  readonly createOption!: CreateOptionFunction;

  @Ref() readonly inputField!: HTMLInputElement;

  @Watch("syncedValue")
  private valueChanged(newValue: Object | String) {
    this.searchText = this.getDisplayName(newValue);
  }

  mounted() {
    this.searchText = this.getDisplayName(this.syncedValue);
  }

  private get matchingOptions(): Array<Object | String> {
    if (!this.searchText) return this.options;
    return this.options.filter(option => this.isMatch(this.searchText, option));
  }

  private inputFocussed(): void {
    this.inputField.select();
    this.highlightIndex = 0;
    this.showOptions = true;
  }

  private inputBlurred(): void {
    this.showOptions = false;
    if (this.exactMatch) {
      if (this.autoSelectOnBlur) {
        const selected = this.selectHighlighted();
        // If nothing was selected, it means the search text does not match a
        // valid option. So reset the search text to the old value.
        if (!selected) this.searchText = this.getDisplayName(this.syncedValue);
      }
    } else {
      // Emit the matching value. If there is no matching value, emit the
      // search-text since exactMatch has not been set.
      this.$emit("update:value", this.createOption(this.searchText));
    }
  }

  private highlightDown(): void {
    if (!this.showOptions) {
      this.showOptions = true;
    } else if (this.highlightIndex < this.matchingOptions.length - 1) {
      ++this.highlightIndex;
    }
  }

  private highlightUp(): void {
    if (!this.showOptions) {
      this.showOptions = true;
    } else if (this.highlightIndex > 0) {
      --this.highlightIndex;
    }
  }

  private searchTextChanged(): void {
    this.showOptions = true;
    this.highlightIndex = 0;
  }

  private handleInputEnter(): void {
    if (!this.showOptions) this.showOptions = true;
    else this.selectHighlighted();
  }

  /**
   * Selects the highlighted option and returns true.
   * If there is no highlighted option, does nothing and returns false.
   */
  private selectHighlighted(): boolean {
    if (this.matchingOptions.length > this.highlightIndex) {
      this.optionSelected(this.matchingOptions[this.highlightIndex]);
      return true;
    }
    return false;
  }

  private optionSelected(option: Object | String): void {
    this.searchText = this.getDisplayName(option);
    this.syncedValue = option;
    this.showOptions = false;
  }

  private searchText = "";
  private showOptions = false;
  private highlightIndex = 0;
}

function defaultGetDisplayName(option: Object | String): string {
  return option.toLocaleString();
}

function defaultIsMatch(searchText: string, option: Object | String): boolean {
  const searchTextLowerCase = searchText.toLowerCase();
  return option
    .toString()
    .toLowerCase()
    .includes(searchTextLowerCase);
}

function defaultIsExactMatch(
  searchText: string,
  option: Object | String
): boolean {
  return option.toString() === searchText;
}

function defaultCreateOption(input: string): Object | String {
  return input;
}
</script>

<style lang="scss" scoped>
$border-radius: 5px;
$border-width: 1px;
$background-color: white;
$font-size: 14px;
$line-height-multiplier: 1.8;
$padding: 5px;
$primary-color: gray;
$secondary-color: lightgray;

.tree-ware-select {
  box-sizing: content-box;
  display: inline-block;
  font-size: $font-size;
  line-height: $line-height-multiplier;
  position: relative;

  input {
    border: $border-width solid $primary-color;
    border-radius: $border-radius;
    box-sizing: border-box;
    font-size: $font-size;
    line-height: $line-height-multiplier;
    padding: $padding;
    width: 100%;
  }

  .tree-ware-select-options {
    background-color: $background-color;
    border: $border-width solid $primary-color;
    border-bottom-left-radius: $border-radius;
    border-bottom-right-radius: $border-radius;
    border-collapse: collapse;
    border-top: none;
    display: none;
    line-height: $line-height-multiplier;
    max-height: 200px;
    position: absolute;
    table-layout: fixed;
    width: 100%;
    z-index: 2;

    .tree-ware-select-option-row {
      td {
        padding: $padding;
      }

      .frequency-count {
        text-align: right;
        border-right: 1px solid $primary-color;
      }

      .display-name {
        width: 100%;
      }

      &.highlight {
        background-color: $primary-color;
      }
      &:hover {
        background-color: $secondary-color;
        cursor: pointer;
      }
    }
  }
}

.options-visible {
  input {
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }

  .tree-ware-select-options {
    display: block;
  }
}
</style>