<template>
  <div class="flex flex-col">
    <div
      v-for="(tag, index) in tagsInternal"
      :key="tag.key + ':' + tag.value"
      class="flex flex-row items-start py-2"
    >
      <div class="flex flex-1 flex-row">
        <tree-ware-tag-editor
          :tag-key.sync="tag.key"
          :value.sync="tag.value"
          :tags="tagsInternal"
          :key-options="keyOptions"
          :tag-value-counts="tagValueCounts"
          :tag-value-constraints="tagValueConstraints"
          :is-required="isRequiredTag(tag)"
          :disabled="disabled"
          class="flex flex-1"
        />
        <a
          :class="{'invisible': isRequiredTag(tag)}"
          @click="deleteTag(index)"
          :disabled="disabled"
          class="ml-4 mt-2"
        >
          <vs-icon icon="fa-trash-alt" icon-pack="fas" color="warning" />
        </a>
      </div>
    </div>
    <vs-button @click="addTag()" icon="fa-plus" icon-pack="fas" :disabled="disabled" class="mt-4"></vs-button>
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

import { TagValueConstraints } from "./TagValueConstraints";
import { Tag, ValueCount, TagValueCounts } from "./TagValueCounts";
import TreeWareTagEditor from "./TreeWareTagEditor.vue";

@Component({
  components: {
    TreeWareTagEditor
  }
})
export default class TreeWareMultipleTagsEditor extends Vue {
  @Prop() tags!: Tag[];
  @Prop() tagValueCounts?: TagValueCounts;
  @Prop() readonly tagValueConstraints?: TagValueConstraints;
  @Prop({ default: () => [] }) readonly requiredTags!: string[];

  @Prop({ default: false }) readonly disabled!: boolean;

  beforeMount() {
    this.tagsInternal = [...this.tags];
    this.keyOptions = this.getKeyOptions();
  }

  @Watch("tags")
  tagsChanged(newTags: Tag[], oldTags: Tag[]) {
    this.tagsInternal = [...newTags];
  }

  getTags(): Tag[] {
    return this.tagsInternal;
  }

  private isRequiredTag(tag: Tag): boolean {
    return this.requiredTags.indexOf(tag.key) >= 0;
  }

  private getKeyOptions(): string[] | null {
    if (this.requiredTags.length == 0) return null;
    if (!this.tagValueCounts) return null;
    // Return keys from tagValueCounts that are not in requiredTags
    return Object.keys(this.tagValueCounts).filter(
      key => this.requiredTags.indexOf(key) < 0
    );
  }

  private addTag(): void {
    this.tagsInternal.push({ key: "", value: "" });
  }

  private deleteTag(index: number): void {
    this.tagsInternal.splice(index, 1);
  }

  private tagsInternal: Tag[] = [];
  private keyOptions: string[] | null = null;
}
</script>
