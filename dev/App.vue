<template>
  <div class="dev-app">
    <header class="dev-header">
      <h1>Markdown Editor – Dev Playground</h1>
    </header>

    <main class="dev-main">
      <section class="editor-section">
        <h2>Editor</h2>
        <MarkdownEditor :editor="editor" />
      </section>

      <section class="output-section">
        <h2>Markdown Output</h2>
        <pre class="output-pre">{{ editor.markdownContent.value }}</pre>
      </section>
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
  background: #f5f5f5;
  color: #1a1a1a;
}
</style>

<style scoped>
.dev-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dev-header {
  background: #1a1a1a;
  color: #fff;
  padding: 1rem 2rem;
}

.dev-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.dev-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  flex: 1;
}

.editor-section,
.output-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

h2 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
}

.output-pre {
  font-family: "Courier New", monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.75rem;
}
</style>
