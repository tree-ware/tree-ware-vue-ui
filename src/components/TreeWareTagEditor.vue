<template>
  <div class="flex flex-row items-start">
    <validation-provider
      immediate
      :rules="{required: true, uniqueTag: tags}"
      v-slot="{ errors, invalid }"
      class="key-selector flex-1 pr-2"
    >
      <tree-ware-select v-model="syncedKey" :options="keyOptions" class="flex-1 w-full"></tree-ware-select>
      <span v-if="invalid" class="field-error">{{ errors[0] }}</span>
    </validation-provider>
    <validation-provider
      immediate
      :rules="getValueRules(syncedKey)"
      v-slot="{ errors, invalid }"
      class="value-selector flex-1"
    >
      <tree-ware-select
        v-model="valueCount"
        :options="valueCountOptions"
        :get-display-name="(option) => option.value"
        :get-frequency-count="(option) => option.count"
        :create-option="createValueCount"
        class="w-full"
      ></tree-ware-select>
      <span v-if="invalid" class="field-error">{{ errors[0] }}</span>
    </validation-provider>
  </div>
</template>

<script lang="ts">
import TreeWareSelect from "./TreeWareSelect.vue";
import { TagValueConstraints } from "./TagValueConstraints";
import { Tag, TagValueCounts, ValueCount } from "./TagValueCounts";

import "reflect-metadata";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { extend } from "vee-validate";

extend("uniqueTag", {
  params: ["tags"],
  validate: (value, params) => {
    const tags = (params as any).tags as Tag[];
    if (!Array.isArray(tags)) return true;
    const exactMatches = tags.filter((tag: Tag) => tag.key === value).length;
    // The `value` being validated should appear only once in the tags.
    return exactMatches <= 1;
  },
  message: "Value is not unique"
});

@Component({
  components: {
    TreeWareSelect
  }
})
export default class TreeWareTagEditor extends Vue {
  @Prop({ default: "" }) readonly tagKey!: string;
  @Prop({ default: "" }) readonly value!: string;

  @Prop() readonly tags!: Tag[];
  @Prop() readonly tagValueCounts?: TagValueCounts;
  @Prop() readonly tagValueConstraints?: TagValueConstraints;

  beforeMount() {
    this.initSyncedKey();
    this.initValueCount();
  }

  private get syncedKey(): string {
    return this.syncedKeyInternal;
  }
  private set syncedKey(newKey: string) {
    this.syncedKeyInternal = newKey;
    this.resetValueCount();
    this.$emit("update:tagKey", newKey);
  }

  private get valueCount(): ValueCount {
    return this.valueCountInternal;
  }
  private set valueCount(newValueCount: ValueCount) {
    this.valueCountInternal = newValueCount;
    this.$emit("update:value", newValueCount.value);
  }

  private initSyncedKey(): void {
    this.syncedKeyInternal = this.tagKey;
  }

  private initValueCount(): void {
    const exactMatch = this.valueCountOptions.find(
      valueCount => valueCount.value === this.value
    );
    this.valueCount =
      exactMatch === undefined ? this.createValueCount(this.value) : exactMatch;
  }

  private resetValueCount(): void {
    const valueCounts = this.valueCountOptions;
    this.valueCount =
      valueCounts.length === 0 ? this.createValueCount("") : valueCounts[0];
  }

  private get keyOptions(): string[] {
    return this.tagValueCounts ? Object.keys(this.tagValueCounts) : [];
  }

  private get valueCountOptions(): ValueCount[] {
    return this.tagValueCounts
      ? this.tagValueCounts[this.syncedKeyInternal] || []
      : [];
  }

  private getValueRules(tagKey: string): string {
    return this.tagValueConstraints
      ? this.tagValueConstraints.rulesGetter(tagKey)
      : "";
  }

  private getValueHintText(tagKey: string): string {
    return this.tagValueConstraints
      ? this.tagValueConstraints.hintGetter(tagKey)
      : "";
  }

  private createValueCount(newValue: string): ValueCount {
    return { value: newValue, count: 0 };
  }

  private syncedKeyInternal: string = "";
  private valueCountInternal!: ValueCount;
}
</script>
