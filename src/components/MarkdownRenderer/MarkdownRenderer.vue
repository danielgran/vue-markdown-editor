<template>
  <div class="markdown-renderer">
    <template v-if="nodes.length > 0">
      <component
        :is="RenderComponentRegistry[node.type]"
        v-for="node in nodes"
        :key="node.id"
        :state="node.componentState"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { parseMarkdown } from "../MarkdownEditor/Composable/parseMarkdown";
import RenderComponentRegistry from "./MarkdownRenderComponentRegistry";

const props = defineProps({
  markdown: {
    type: String,
    required: true,
  },
})

const nodes = computed(() => parseMarkdown(props.markdown));
</script>
