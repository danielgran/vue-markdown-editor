<template>
  <div class="markdown-renderer">
    <template v-if="nodes.length > 0">
      <component
        :is="registry[node.type]"
        v-for="node in nodes"
        :key="node.id"
        :state="node.componentState"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from "vue";
import { parseMarkdown } from "../MarkdownEditor/Composable/parseMarkdown";
import type { MarkdownRendererInstance } from "./Composable/useMarkdownRenderer";
import defaultRenderComponentRegistry from "./defaultRenderComponentRegistry";

const props = defineProps({
  markdown: {
    type: String,
    required: true,
  },
  renderer: {
    type: Object as PropType<MarkdownRendererInstance>,
    default: undefined,
  },
});

const nodes = computed(() => parseMarkdown(props.markdown));

const registry = computed(() => props.renderer?.componentRegistry ?? defaultRenderComponentRegistry);
</script>
