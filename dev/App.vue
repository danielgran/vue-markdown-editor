<template>
  <div class="dev-app">
    <aside class="dev-output">
      <div class="dev-output-header">
        <nav class="dev-tabs">
          <button
            type="button"
            class="dev-tab"
            :class="{ active: activeTab === 'raw' }"
            @click="activeTab = 'raw'"
          >
            Raw
          </button>
          <button
            type="button"
            class="dev-tab"
            :class="{ active: activeTab === 'preview' }"
            @click="activeTab = 'preview'"
          >
            Preview
          </button>
        </nav>
        <button
          type="button"
          class="copy-btn"
          :class="{ copied: copySuccess }"
          @click="copyToClipboard"
        >
          {{ copySuccess ? '✓ Copied!' : '📋 Copy' }}
        </button>
      </div>
      <pre v-if="activeTab === 'raw'">{{ editor.markdownContent.value }}</pre>
      <div v-else class="dev-preview">
        <MarkdownRenderer :markdown="editor.markdownContent.value" />
      </div>
    </aside>
    <main class="dev-editor">
      <div class="dev-editor-header">
        <h1>vue-markdown-editor</h1>
        <p class="subtitle">
          A block-based markdown editor for Vue 3, powered by TipTap. <br>
          Click blocks to focus, use <kbd>Enter</kbd> to split, <kbd>Backspace</kbd> on empty blocks to delete,
          <kbd>↑</kbd>/<kbd>↓</kbd> to navigate, and drag the handle (⠿) to reorder.
        </p>
      </div>
      <MarkdownEditor :editor="editor" :image-upload-function="handleUploadImage"
      :file-upload-function="handleFileupload"
      />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import MarkdownEditor from "@/components/MarkdownEditor/MarkdownEditor.vue";
import MarkdownRenderer from "@/components/MarkdownRenderer/MarkdownRenderer.vue";
import { useMarkdownEditor } from "@/components/MarkdownEditor/Composable/useMarkdownEditor";

const activeTab = ref<"raw" | "preview">("raw");
const copySuccess = ref(false);

const editor = useMarkdownEditor(`# Welcome to vue-markdown-editor

## What is this?

A block-based, node-editable Markdown editor built for Vue 3 with TipTap. Each part of your markdown is a separate, draggable block.

### Key Features

Each block type has its own editor — headlines use single-line heading inputs, paragraphs use rich text with a placeholder, and lists are fully interactive.

- Drag any block by its handle (⠿) to reorder
- Use the + button to insert a new block below
- Delete a block with the 🗑️ button or Backspace on an empty block
- Change block type via the context menu (right-click or click the block's context menu trigger)
- Select text to see the inline formatting toolbar (Bold, Italic, Underline)
- Images support editing src, alt, and caption via a modal

### Images

"""MarkdownModuleImage
src: https://via.placeholder.com/600x200/3b82f6/ffffff
alt: A blue placeholder banner
caption: Example image with caption
"""

### Getting Started

Simply install the package and start editing. The editor serializes back to clean markdown automatically.

## Advanced Usage

### Custom Components

Images are rendered as custom blocks with their own context menu and editing modal — right-click an image to see options.

### Keyboard Shortcuts

- Arrow Up / Down to move focus between blocks
- Enter to split a block and create a new one below
- Backspace on an empty block removes it
- Delete on an empty block removes it (focus stays at same index)

### Lists

Lists support multiple items with rich text inside each item. Add items by pressing Enter within the list editor.`);

async function handleUploadImage(file: File): Promise<string> {
  // Simulate an image upload and return a URL
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://placehold.co/600x400?text=${encodeURIComponent(file.name)}`);
    }, 1000);
  });
}

async function handleFileupload(file: File): Promise<string> {
  // Simulate a file upload and return a URL
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://example.com/files/${encodeURIComponent(file.name)}`);
    }, 1000);
  });
}
async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(editor.markdownContent.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch {
    // Fallback for environments without clipboard API
    const textarea = document.createElement("textarea");
    textarea.value = editor.markdownContent.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: #f8fafc;
  color: #1e293b;
}
</style>

<style scoped>
.dev-app {
  display: grid;
  grid-template-columns: 1fr 2fr;
  min-height: 100vh;
}

.dev-output {
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  overflow: auto;
  display: flex;
  flex-direction: column;

  .dev-output-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f1f5f9;
    position: sticky;
    top: 0;
    z-index: 10;

    .dev-tabs {
      display: flex;
      gap: 0;
    }

    .dev-tab {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.5rem 0.85rem;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;

      &:hover {
        color: #64748b;
      }

      &.active {
        color: #0f172a;
        border-bottom-color: #3b82f6;
      }
    }

    .copy-btn {
      font-size: 0.75rem;
      padding: 0.3rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.375rem;
      background: #ffffff;
      cursor: pointer;
      color: #475569;
      transition: all 0.15s ease;

      &:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
      }

      &.copied {
        background: #dcfce7;
        border-color: #86efac;
        color: #166534;
      }
    }
  }

  pre {
    font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    padding: 1.25rem;
    color: #334155;
  }

  .dev-preview {
    padding: 1.25rem;
    line-height: 1.7;
    overflow: auto;
  }
}

.dev-editor {
  padding: 2rem 2.5rem;
  overflow: auto;

  .dev-editor-header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #e2e8f0;

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.6;

      kbd {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        font-size: 0.75rem;
        font-family: inherit;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 0.25rem;
        box-shadow: 0 1px 0 #cbd5e1;
        color: #334155;
      }
    }
  }
}
</style>
