<template>
  <div class="dev-app">
    <aside class="dev-output">
      <pre>{{ editor.markdownContent.value }}</pre>
    </aside>
    <main class="dev-editor">
      <MarkdownEditor :editor="editor" />
    </main>
  </div>
</template>

<script lang="ts" setup>
import MarkdownEditor from "@/components/MarkdownEditor/MarkdownEditor.vue";
import { useMarkdownEditor } from "@/components/MarkdownEditor/Composable/useMarkdownEditor";

const editor = useMarkdownEditor("# Hello World\n\nStart editing here...");
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
}
</style>

<style scoped>
.dev-app {
  display: grid;
  grid-template-columns: 1fr 2fr;
  min-height: 100vh;
}

.dev-output {
  padding: 1rem;
  border-right: 1px solid #ccc;
  overflow: auto;

  pre {
    font-family: monospace;
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.dev-editor {
  padding: 2rem;
}
</style>
