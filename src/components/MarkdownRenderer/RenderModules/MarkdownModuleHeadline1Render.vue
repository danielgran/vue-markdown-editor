<template>
  <h1 v-html="html" />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { marked } from "marked";
import type MarkdownModuleTextState from "../../MarkdownEditor/Modules/MarkdownModuleTextState";

const props = defineProps<{ state: MarkdownModuleTextState }>();
const html = computed(() => marked.parseInline(props.state.text) as string);
</script>
