<template>
  <ul>
    <li
      v-for="(item, index) in state.items"
      :key="index"
      v-html="itemHtml(item)"
    />
  </ul>
</template>

<script lang="ts" setup>
import { marked } from "marked";
import type MarkdownModuleListState from "../../MarkdownEditor/Modules/MarkdownModuleListState";
import type MarkdownModuleTextState from "../../MarkdownEditor/Modules/MarkdownModuleTextState";

defineProps<{ state: MarkdownModuleListState }>();

function itemHtml(item: MarkdownModuleTextState): string {
  return marked.parseInline(item.text) as string;
}
</script>
