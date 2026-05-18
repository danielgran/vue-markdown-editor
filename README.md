# @grandaniel/vue-markdown-editor

Vue 3 markdown editor component library.

## Installation

```bash
npm install @grandaniel/vue-markdown-editor
```

## Quick Start

```vue
<script setup lang="ts">
import { ref } from "vue";
import { MarkdownEditor, useMarkdownEditor } from "@grandaniel/vue-markdown-editor";
import "@grandaniel/vue-markdown-editor/dist/vue-markdown-editor.css";

const editor = useMarkdownEditor("# Hello\n\nStart writing...");
const focusedNode = ref(null);
</script>

<template>
  <MarkdownEditor
    :editor="editor"
    v-model:focused-node="focusedNode"
  />
</template>
```
