<template>
  <pre><code
    :class="state.language ? `language-${state.language}` : ''"
  >{{ state.code }}</code></pre>
</template>

<script lang="ts" setup>
import type MarkdownModuleCodeBlockState from "../../MarkdownEditor/Modules/MarkdownModuleCodeBlockState";

defineProps<{ state: MarkdownModuleCodeBlockState }>();
</script>
