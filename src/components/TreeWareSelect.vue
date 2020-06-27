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
      :disabled="disabled"
    />
    <table class="tree-ware-select-options">
      <tr
        v-for="(option, index) in matchingOptions"
        :key="getDisplayName(option)"
        @mousedown.prevent
        @click="optionClicked(index, option)"
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
  @Prop({ default: false }) readonly exactMatch!: boolean;

  /** Auto-selects first option. Applicable only if exactMatch is true. */
  @Prop({ default: false }) readonly autoSelectOnBlur!: boolean;

  @Prop({ type: [Object, String] }) readonly value!: Object | String;
  @Prop({ default: () => [] }) readonly options!: Array<Object | String>;

  @Prop({ default: defaultGetDisplayName })
  readonly getDisplayName!: GetDisplayNameFunction;

  @Prop() readonly getFrequencyCount?: GetFrequencyCountFunction;

  @Prop() readonly isExactMatch?: MatchFunction;
  @Prop() readonly isMatch?: MatchFunction;

  /** A function to create an option object from a user's input string */
  @Prop({ default: defaultCreateOption })
  readonly createOption!: CreateOptionFunction;

  @Prop({ default: false }) readonly disabled!: boolean;

  @Ref() readonly inputField!: HTMLInputElement;

  @Watch("syncedValue")
  private valueChanged(newValue: Object | String) {
    this.searchText = this.getDisplayName(newValue);
  }

  private get syncedValue(): Object | String {
    return this.value;
  }
  private set syncedValue(newValue: Object | String) {
    this.$emit("input", newValue);
  }

  mounted() {
    this.isExactMatchInternal = this.isExactMatch
      ? this.isExactMatch
      : this.defaultIsExactMatch;
    this.isMatchInternal = this.isMatch ? this.isMatch : this.defaultIsMatch;

    this.resetHighlightIndex();
    this.searchText = this.getDisplayName(this.syncedValue);
  }

  private get matchingOptions(): Array<Object | String> {
    if (!this.editing || !this.searchText) return this.options;
    return this.options.filter(option =>
      this.isMatchInternal(this.searchText, option)
    );
  }

  private inputFocussed(): void {
    this.inputField.select();
    this.resetHighlightIndex();
    this.showOptions = true;
  }

  private inputBlurred(): void {
    if (this.exactMatch) {
      if (this.autoSelectOnBlur) {
        const selected = this.selectHighlighted();
        // If nothing was selected, it means the search text does not match a
        // valid option. So reset the search text to the old value.
        if (!selected) this.searchText = this.getDisplayName(this.syncedValue);
      }
    } else {
      // Emit the matching value. If there is no matching value, emit the
      // search-text since `exactMatch` has not been set.
      const exactMatchOption = this.options.find(option =>
        this.isExactMatchInternal(this.searchText, option)
      );
      const option = exactMatchOption
        ? exactMatchOption
        : this.createOption(this.searchText);
      this.selectOption(option);
    }
    this.editing = false;
    this.showOptions = false;
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
    this.editing = true;
    this.showOptions = true;
    this.resetHighlightIndex();
  }

  private handleInputEnter(): void {
    if (!this.showOptions) this.showOptions = true;
    else {
      const selected = this.selectHighlighted();
      if (!selected && !this.exactMatch) {
        // Exact-match is not required and there is no highlighted option,
        // so set the search-text as the new selected value.
        const newOption = this.createOption(this.searchText);
        this.selectOption(newOption);
      }
    }
  }

  /**
   * Selects the highlighted option and returns true.
   * If there is no highlighted option, does nothing and returns false.
   */
  private selectHighlighted(): boolean {
    if (this.highlightIndex < 0) return false;
    if (this.matchingOptions.length > this.highlightIndex) {
      this.selectOption(this.matchingOptions[this.highlightIndex]);
      return true;
    }
    return false;
  }

  private optionClicked(index: number, option: Object | String): void {
    this.highlightIndex = index;
    this.selectOption(option);
  }

  private selectOption(option: Object | String): void {
    this.searchText = this.getDisplayName(option);
    this.syncedValue = option;
    this.showOptions = false;
  }

  private resetHighlightIndex(): void {
    this.highlightIndex = this.options.findIndex(option =>
      this.isExactMatchInternal(this.searchText, option)
    );
  }

  private defaultIsExactMatch(
    searchText: string,
    option: Object | String
  ): boolean {
    return this.getDisplayName(option) === searchText;
  }

  private defaultIsMatch(searchText: string, option: Object | String): boolean {
    const searchTextLowerCase = searchText.toLowerCase();
    return this.getDisplayName(option)
      .toLowerCase()
      .includes(searchTextLowerCase);
  }

  private isExactMatchInternal!: MatchFunction;
  private isMatchInternal!: MatchFunction;

  private searchText = "";
  private editing = false;
  private showOptions = false;
  private highlightIndex = -1;
}

function defaultGetDisplayName(option: Object | String): string {
  return option.toLocaleString();
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
$padding-x: 10px;
$padding-y: 5px;
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
    padding: $padding-y $padding-x;
    width: 100%;

    &:disabled {
      background-color: rgba(white, 0.1);
    }
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
    overflow: scroll;
    position: absolute;
    table-layout: fixed;
    width: 100%;
    z-index: 200;

    .tree-ware-select-option-row {
      td {
        padding: $padding-y $padding-x;
      }

      .frequency-count {
        text-align: right;
        border-right: 1px solid $primary-color;
        word-break: keep-all;
      }

      .display-name {
        width: 100%;
        word-break: break-all;
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
    z-index: 1000;
  }
}
</style>