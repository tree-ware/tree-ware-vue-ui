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
          :tagValueCounts="tagValueCounts"
          class="flex flex-1"
        />
        <a @click="deleteTag(index)" class="ml-4 mt-2">
          <vs-icon icon="fa-trash-alt" icon-pack="fas" color="warning" />
        </a>
      </div>
    </div>
    <vs-button @click="addTag()" icon="fa-plus" icon-pack="fas" class="mt-4"></vs-button>
  </div>
</template>

<script lang="ts">
import "reflect-metadata";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

import {
  Tag,
  ValueCount,
  TagValueCounts
} from "@/tree-ware-vue-ui/src/components/TagValueCounts";
import TreeWareTagEditor from "@/tree-ware-vue-ui/src/components/TreeWareTagEditor.vue";

@Component({
  components: {
    TreeWareTagEditor
  }
})
export default class TreeWareMultipleTagsEditor extends Vue {
  @Prop() tags!: Tag[];
  @Prop() tagValueCounts?: TagValueCounts;

  beforeMount() {
    this.tagsInternal = [...this.tags];
  }

  @Watch("tags")
  tagsChanged(newTags: Tag[], oldTags: Tag[]) {
    this.tagsInternal = [...newTags];
  }

  getTags(): Tag[] {
    return this.tagsInternal;
  }

  private addTag(): void {
    this.tagsInternal.push({ key: "", value: "" });
  }

  private deleteTag(index: number): void {
    this.tagsInternal.splice(index, 1);
  }

  private tagsInternal: Tag[] = [];
}
</script>
