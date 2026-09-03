<template>
  <div
    ref="divRef"
    class="markdown-module-hr"
    tabindex="0"
    @focus="handleFocus"
  >
    <hr>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type MarkdownModuleHrState from "./MarkdownModuleHrState";

defineModel<MarkdownModuleHrState>({ required: true });

const divRef = ref<HTMLDivElement>();

function handleFocus() {
  // no-op; exists so the block can be focused by the editor wrapper
}

function focus() {
  divRef.value?.focus();
}

defineExpose({ focus });
</script>

<style lang="scss" scoped>
.markdown-module-hr {
  outline: none;
  padding: 0.5rem 0;

  hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 0;
  }
}
</style>
