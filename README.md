<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/img/editor-1.png">
  <img alt="vue-markdown-editor — A block-based, Notion-like markdown editor for Vue 3" src="docs/img/editor-1.png">
</picture>

# @grandaniel/vue-markdown-editor

> A block-based, Notion-like Markdown editor **and** SSR-safe renderer for Vue 3. UI-first. Powered by [TipTap](https://tiptap.dev/).

**@grandaniel/vue-markdown-editor** provides two complementary packages:

- **Editor** — A rich block-editing experience where every Markdown element — headlines, bullet & numbered lists, tables, blockquotes, code blocks, dividers, images, and files — is its own independently editable, draggable block. Built for content-first workflows: write, reorder, and format with keyboard shortcuts and an always-visible drag handle.

- **Renderer** — A lightweight, SSR-safe component that renders Markdown strings to semantic HTML. Uses the same `remark-parse` pipeline as the editor, so custom module blocks render identically. Fully customizable: override any default render component with your own Vue components.

Images are first-class citizens: paste an image to auto-upload, then edit its **src**, **alt text**, and **caption** in a dedicated modal. The editor serializes back to clean Markdown automatically.

---

## Table of Contents

- [Who uses it](#who-uses-it)
- [Installation](#installation)
- [Editor](#editor)
  - [Quick Start](#editor-quick-start)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Image Upload](#image-upload)
  - [API Reference](#editor-api-reference)
- [Renderer](#renderer)
  - [Quick Start](#renderer-quick-start)
  - [Custom Render Components](#custom-render-components)
  - [API Reference](#renderer-api-reference)
- [Exported Types & Utilities](#exported-types--utilities)
- [Custom Styling](#custom-styling)
- [Supply Chain Security](#supply-chain-security)
- [Contributing](#contributing)
- [License](#license)

---

## Who uses it

| Project                                            | How                                                                                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **[heartbeat.systems](https://heartbeat.systems)** | Admin utility — content editors manage help articles, release notes, and in-app documentation through the block editor.                 |
| **[markdownstud.io](https://markdownstud.io)**     | AI writing assistant — the editor serves as the primary composition surface where users draft, review, and polish AI-generated content. |

---

## Installation

```bash
npm install @grandaniel/vue-markdown-editor
```

> **Peer dependency:** Vue `^3.5.0`  
> **Node:** `>=22`

Import the components **and** the stylesheet:

```ts
import {
  MarkdownEditor,
  MarkdownRenderer,
  useMarkdownEditor,
  useMarkdownRenderer,
} from "@grandaniel/vue-markdown-editor";
import "@grandaniel/vue-markdown-editor/style.css";
```

---

## Editor

The editor is driven by a composable: `useMarkdownEditor()` creates the reactive state, and `<MarkdownEditor>` renders it.

### Editor Quick Start

```vue
<script setup lang="ts">
import { ref } from "vue";
import {
  MarkdownEditor,
  useMarkdownEditor,
  type MarkdownAstNode,
} from "@grandaniel/vue-markdown-editor";
import "@grandaniel/vue-markdown-editor/style.css";

const editor = useMarkdownEditor("# Hello, world!\n\nStart writing here…");
const focusedNode = ref<MarkdownAstNode | null>(null);
</script>

<template>
  <MarkdownEditor :editor="editor" v-model:focused-node="focusedNode" />
</template>
```

#### Reading the output

The composable keeps the raw Markdown in sync automatically. Read it at any time:

```ts
console.log(editor.markdownContent.value);
// "# Hello, world!\n\nStart writing here…"
```

You can also **programmatically set** the content:

```ts
editor.markdownContent.value = "## New heading\n\nFresh content.";
```

---

### Keyboard Shortcuts

| Key                                | Action                                           |
| ---------------------------------- | ------------------------------------------------ |
| <kbd>↑</kbd> / <kbd>↓</kbd>        | Move focus between blocks                        |
| <kbd>Enter</kbd>                   | Split current block → insert new paragraph below |
| <kbd>Backspace</kbd> (empty block) | Delete the block, focus moves up                 |
| <kbd>Delete</kbd> (empty block)    | Delete the block, focus stays at same index      |
| Click blank area                   | Append a new empty paragraph at the bottom       |

#### Auto type‑detection

Type `# `, `## `, or `### ` at the start of a paragraph and the block auto‑converts to the matching heading level.

---

### Block modules & serialized Markdown

The editor splits Markdown into **block modules** — every module is its own draggable, editable block:

| Module        | Markdown                     | Edits                                        |
| ------------- | ---------------------------- | -------------------------------------------- |
| Paragraph     | plain text                   | Rich text (bold, italic, links, inline code) |
| Heading       | `# ` / `## ` / `### `        | Single-line text                             |
| Bullet list   | `- item`                     | Multiple rich-text items                     |
| Numbered list | `1. item`                    | Multiple rich-text items                     |
| Blockquote    | `> line`                     | Rich-text quote, one `>` per line            |
| Code block    | fenced code `lang…`          | Monospace code + optional language           |
| Divider (HR)  | `---`                        | Static horizontal rule                       |
| Table         | GFM pipe table               | Cell-by-cell grid (headers + rows)           |
| Image         | `"""MarkdownModuleImage…"""` | src / alt / caption via a modal              |
| File          | `"""MarkdownModuleFile…"""`  | Downloadable attachment                      |

Most blocks are parsed from **standard Markdown** — paste a Markdown document and it is split into blocks automatically. Headings also convert on the fly: type `# `, `## `, or `### ` at the start of a paragraph, or type `> `, `1. `, a code fence, or `---` for the matching non-heading block.

The special `"""…"""` blocks carry extra metadata and are used for images and files. Here is the exact Markdown the editor accepts and produces for every module:

````markdown
# Heading 1

## Heading 2

### Heading 3

A **paragraph** with _inline_ markup and a [link](https://example.com).

- Bullet item one
- Bullet item two

1. Numbered item one
2. Numbered item two

> A blockquote line
> Another blockquote line

```ts
const port = 25565;
```

---

| Module | Kind          |
| ------ | ------------- |
| Table  | Grid of cells |

"""MarkdownModuleImage
src: https://example.com/photo.jpg
alt: A scenic view
caption: Photo caption
"""

"""MarkdownModuleFile
url: https://example.com/file.pdf
fileName: file.pdf
fileSize: 1024
mimeType: application/pdf
"""
````

### Image Upload

Images are first-class blocks with **src**, **alt text**, and **caption** fields. Right‑click any image → **Edit Attributes** to open the editing modal.

#### Paste‑to‑upload

Pass an `imageUploadFunction` prop — any pasted image (`Ctrl+V`) from the clipboard will be sent through your upload handler and inserted as a new image block:

```vue
<script setup lang="ts">
async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const { url } = await res.json();
  return url;
}
</script>

<template>
  <MarkdownEditor :editor="editor" :image-upload-function="uploadImage" />
</template>
```

The serialized Markdown uses a custom block syntax for images:

```markdown
"""MarkdownModuleImage
src: https://example.com/photo.jpg
alt: A scenic mountain view
caption: Photo taken during the 2026 summit
"""
```

> **Note:** `imageUploadFunction` is optional. Without it, pasted images from the clipboard are ignored.

---

### Editor API Reference

#### `useMarkdownEditor(initialContent?: string)`

Returns a reactive editor instance:

| Member                                   | Type                                                                            | Description                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `markdownContent`                        | `Ref<string>`                                                                   | Reactive raw Markdown. Read to serialize, write to load content.      |
| `markdownNodes`                          | `Ref<MarkdownAstNode[]>`                                                        | Reactive array of AST nodes.                                          |
| `deleteNode(index)`                      | `(index: number) => void`                                                       | Remove the node at `index`.                                           |
| `addBlankNode(index?)`                   | `(index?: number) => number`                                                    | Insert an empty paragraph at `index` (or end). Returns the new index. |
| `addNodeWithType(index, type, content?)` | `(index: number, type: MarkdownNodeType, content?: string) => number`           | Insert a typed node. Returns the new index.                           |
| `replaceNodeType(node, newType)`         | `(node: MarkdownAstNode, type: MarkdownNodeType) => { newNode, index } \| null` | Convert between block types (e.g. paragraph → heading).               |
| `moveNode(from, to)`                     | `(fromIndex: number, toIndex: number) => void`                                  | Programmatically reorder a block.                                     |

#### `MarkdownEditor` props

| Prop                  | Type                              | Required | Description                          |
| --------------------- | --------------------------------- | -------- | ------------------------------------ |
| `editor`              | `MarkdownEditorInstance`          | ✓        | Instance from `useMarkdownEditor()`. |
| `focusedNode`         | `MarkdownAstNode \| null`         | —        | For `v-model:focused-node` tracking. |
| `imageUploadFunction` | `(file: File) => Promise<string>` | —        | Async callback for paste‑to‑upload.  |

#### `MarkdownEditor` emits

| Event                 | Payload                   | Description                            |
| --------------------- | ------------------------- | -------------------------------------- |
| `update:focused-node` | `MarkdownAstNode \| null` | Fires when focus moves to a new block. |

#### `MarkdownEditor` slots

| Slot             | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `after-controls` | Injected inside every block, after the drag‑handle / add / delete controls. |

---

## Renderer

`<MarkdownRenderer>` converts a Markdown string to semantic HTML. It uses the same `remark-parse` pipeline as the editor, so custom module blocks (like `"""MarkdownModuleImage"""`) render as rich `<figure>` elements automatically.

The renderer is **SSR‑safe** — no browser APIs, no TipTap. It works in `nuxt generate`, `vite-ssg`, and any server‑side rendering context.

### Renderer Quick Start

```vue
<script setup lang="ts">
import { MarkdownRenderer } from "@grandaniel/vue-markdown-editor";

const markdown = `# Hello World

This is a **paragraph** with *inline* formatting.

- Bullet item one
- Bullet item two

1. Numbered item one
2. Numbered item two

> A short blockquote.

| Feature | Status |
| --- | --- |
| Tables | Rendered |
| Code | Fenced |

---

"""MarkdownModuleImage
src: https://example.com/photo.jpg
alt: A scenic view
caption: Photo caption
"""
`;
</script>

<template>
  <MarkdownRenderer :markdown="markdown" />
</template>
```

#### Live preview alongside the editor

Bind the editor's reactive `markdownContent` to the renderer:

```vue
<script setup lang="ts">
import {
  MarkdownEditor,
  MarkdownRenderer,
  useMarkdownEditor,
} from "@grandaniel/vue-markdown-editor";

const editor = useMarkdownEditor("# Start writing…");
</script>

<template>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
    <MarkdownEditor :editor="editor" />
    <MarkdownRenderer :markdown="editor.markdownContent.value" />
  </div>
</template>
```

---

### Custom Render Components

You can override any default render component with your own Vue component. Use `useMarkdownRenderer()` to create a renderer instance, then call `overrideComponent()` to swap in your custom component for a specific node type.

Each override is **strictly typed** — the replacement component must accept a `state` prop matching the correct state class for that node type (e.g. `MarkdownModuleImageState` for images, `MarkdownModuleTextState` for paragraphs and headings).

#### Overriding the image render component

```vue
<script setup lang="ts">
import {
  MarkdownRenderer,
  useMarkdownRenderer,
  MarkdownAstNodeType,
  type MarkdownModuleImageState,
} from "@grandaniel/vue-markdown-editor";
import CustomImageRender from "./CustomImageRender.vue";

// Create a renderer instance and override the image component
const renderer = useMarkdownRenderer();
renderer.overrideComponent(MarkdownAstNodeType.IMAGE, CustomImageRender);

const markdown = `"""MarkdownModuleImage
src: https://example.com/photo.jpg
alt: A scenic view
caption: My custom caption
"""
`;
</script>

<template>
  <MarkdownRenderer :markdown="markdown" :renderer="renderer" />
</template>
```

Your custom component receives the state as a typed prop:

```vue
<!-- CustomImageRender.vue -->
<script setup lang="ts">
import { type MarkdownModuleImageState } from "@grandaniel/vue-markdown-editor";

defineProps<{ state: MarkdownModuleImageState }>();
</script>

<template>
  <div class="my-custom-image-wrapper">
    <img :src="state.src" :alt="state.alt" />
    <span class="my-caption">{{ state.caption }}</span>
  </div>
</template>
```

#### Available node types and their state classes

| Node Type                          | State Class                    | Prop Interface                                                                               |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `MarkdownAstNodeType.PARAGRAPH`    | `MarkdownModuleTextState`      | `{ text: string }`                                                                           |
| `MarkdownAstNodeType.HEADLINE1`    | `MarkdownModuleTextState`      | `{ text: string }`                                                                           |
| `MarkdownAstNodeType.HEADLINE2`    | `MarkdownModuleTextState`      | `{ text: string }`                                                                           |
| `MarkdownAstNodeType.HEADLINE3`    | `MarkdownModuleTextState`      | `{ text: string }`                                                                           |
| `MarkdownAstNodeType.LIST`         | `MarkdownModuleListState`      | `{ items: MarkdownModuleTextState[] }`                                                       |
| `MarkdownAstNodeType.ORDERED_LIST` | `MarkdownModuleListState`      | `{ items: MarkdownModuleTextState[] }`                                                       |
| `MarkdownAstNodeType.BLOCKQUOTE`   | `MarkdownModuleTextState`      | `{ text: string }`                                                                           |
| `MarkdownAstNodeType.CODE_BLOCK`   | `MarkdownModuleCodeBlockState` | `{ code: string; language: string }`                                                         |
| `MarkdownAstNodeType.HR`           | `MarkdownModuleHrState`        | `{}`                                                                                         |
| `MarkdownAstNodeType.TABLE`        | `MarkdownModuleTableState`     | `{ headers: string[]; rows: string[][] }`                                                    |
| `MarkdownAstNodeType.IMAGE`        | `MarkdownModuleImageState`     | `{ src: string; alt: string; caption: string }`                                              |
| `MarkdownAstNodeType.FILE`         | `MarkdownModuleFileState`      | `{ url: string; fileName: string; fileSize: number; mimeType: string; uploadError: string }` |

---

### Renderer API Reference

#### `useMarkdownRenderer()`

Returns a reactive renderer instance with a customizable component registry:

| Member                               | Type                                                                                           | Description                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `componentRegistry`                  | `Reactive<{ [K in MarkdownNodeType]: RenderComponent<RenderStateMap[K]> }>`                    | Reactive map of node types to their current render components.                                                           |
| `overrideComponent(type, component)` | `<K extends MarkdownNodeType>(type: K, component: RenderComponent<RenderStateMap[K]>) => void` | Replace the render component for a given node type. Strictly typed — the component must accept the correct `state` prop. |

#### `MarkdownRenderer` props

| Prop       | Type                       | Required | Description                                                                                                                                                                                 |
| ---------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markdown` | `string`                   | ✓        | Raw Markdown string to render as HTML.                                                                                                                                                      |
| `renderer` | `MarkdownRendererInstance` | —        | Instance from `useMarkdownRenderer()`. Optional — when omitted, the built-in default render components are used. Provide this to supply custom render components via `overrideComponent()`. |

---

## Exported Types & Utilities

| Export                         | Kind                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `MarkdownEditorInstance`       | Type — return type of `useMarkdownEditor()`.                                                                                                   |
| `MarkdownRendererInstance`     | Type — return type of `useMarkdownRenderer()`.                                                                                                 |
| `MarkdownAstNode`              | Class — AST node with `id`, `type`, `componentState`, `editingState`.                                                                          |
| `MarkdownAstNodeType`          | Enum — `PARAGRAPH`, `HEADLINE1`, `HEADLINE2`, `HEADLINE3`, `IMAGE`, `LIST`, `FILE`, `BLOCKQUOTE`, `CODE_BLOCK`, `HR`, `TABLE`, `ORDERED_LIST`. |
| `ImageNode`                    | Type alias — `MarkdownAstNode<MarkdownModuleImageState>`.                                                                                      |
| `TextNode`                     | Type alias — `MarkdownAstNode<MarkdownModuleTextState>`.                                                                                       |
| `FileNode`                     | Type alias — `MarkdownAstNode<MarkdownModuleFileState>`.                                                                                       |
| `CodeBlockNode`                | Type alias — `MarkdownAstNode<MarkdownModuleCodeBlockState>`.                                                                                  |
| `TableNode`                    | Type alias — `MarkdownAstNode<MarkdownModuleTableState>`.                                                                                      |
| `TextishNodeType`              | Type — union of `PARAGRAPH \| HEADLINE1 \| HEADLINE2 \| HEADLINE3 \| LIST \| ORDERED_LIST \| BLOCKQUOTE`.                                      |
| `isTextNodeState(node)`        | Type guard for text‑based nodes.                                                                                                               |
| `isTextNodeType(type)`         | Type guard for text‑based node types.                                                                                                          |
| `RenderComponent<TState>`      | Type — a Vue component that accepts `{ state: TState }` as props.                                                                              |
| `RenderStateMap`               | Interface — maps each `MarkdownNodeType` to its state class for strict typing.                                                                 |
| `MarkdownModuleImageState`     | Class — state for image nodes (`src`, `alt`, `caption`).                                                                                       |
| `MarkdownModuleFileState`      | Class — state for file nodes (`url`, `fileName`, `fileSize`, `mimeType`, `uploadError`).                                                       |
| `MarkdownModuleCodeBlockState` | Class — state for code blocks (`code`, `language`).                                                                                            |
| `MarkdownModuleTableState`     | Class — state for tables (`headers`, `rows`).                                                                                                  |
| `MarkdownModuleHrState`        | Class — state for dividers (empty).                                                                                                            |

---

## Custom Styling

All components use scoped SCSS. To override styles, use **global CSS** with higher specificity, or Vue's `:deep()` combinator from a parent component.

### CSS class reference

| Class                                       | Applies to                                           |
| ------------------------------------------- | ---------------------------------------------------- |
| `.markdown-editor`                          | Root editor container                                |
| `.markdown-editor-module`                   | Individual block wrapper — `.is-focused` when active |
| `.markdown-editor-module-controls`          | Left control bar (drag handle + add/delete buttons)  |
| `.markdown-editor-module-content`           | Content area inside a block                          |
| `.markdown-editor-module-content-focused`   | Content area when the block is focused               |
| `.markdown-editor-focus-controls`           | Row containing drag‑handle, delete, and add buttons  |
| `.drag-handle`                              | SortableJS drag handle (⠿)                           |
| `.focus-control-btn`                        | Delete / Add buttons in the control bar              |
| `.markdown-editor-context-menu`             | Floating block context menu (`z-index: 1000`)        |
| `.markdown-editor-context-menu-block-item`  | Full‑width context menu button                       |
| `.markdown-editor-context-menu-inline-item` | Inline toolbar button (`.is-active` when toggled)    |
| `.markdown-editor-modal-overlay`            | Modal backdrop (`z-index: 9999`)                     |
| `.markdown-editor-modal`                    | Modal container                                      |
| `.markdown-editor-modal-header`             | Modal title bar                                      |
| `.markdown-editor-modal-title`              | Modal heading text                                   |
| `.markdown-editor-modal-close`              | Close (✕) button                                     |
| `.markdown-editor-modal-body`               | Modal content area                                   |
| `.markdown-editor-modal-footer`             | Modal action bar                                     |
| `.markdown-editor-modal-button`             | Base modal button                                    |
| `.markdown-editor-modal-button-primary`     | Primary (Save) button — blue                         |
| `.markdown-editor-modal-button-secondary`   | Secondary (Cancel) button — gray                     |
| `.markdown-module-image`                    | Image block wrapper                                  |
| `.markdown-module-image-form`               | Image edit form inside the modal                     |
| `.markdown-module-image-form-field`         | Form field group (label + input)                     |

### Styling TipTap content

Each text‑based block hosts its own TinyMCE‑style TipTap editor. Target `.tiptap` inside a block's content area:

```css
/* Make all TipTap editors use your font */
.markdown-editor-module-content .tiptap {
  font-family: "Georgia", serif;
  font-size: 1.1rem;
  line-height: 1.8;
}
```

### Do's

- ✅ Import the stylesheet: `import "@grandaniel/vue-markdown-editor/style.css"`
- ✅ Use **global** (unscoped) CSS or `:deep()` from a parent to override styles
- ✅ Target `.tiptap` inside `.markdown-editor-module-content` for editor typography
- ✅ Use `z-index` values above `1000` / `9999` for anything that must layer **above** context menus and modals

### Don'ts

- ❌ Don't rely on CSS custom properties — the editor uses hard‑coded Tailwind‑scale colors (grays and blues)
- ❌ Don't override `z-index` on `.markdown-editor-context-menu` or `.markdown-editor-modal-overlay` — it will break layering
- ❌ Don't use `display: contents` on `.markdown-editor-module` — it interferes with SortableJS drag logic
- ❌ Don't set `outline: none` on `.markdown-editor-module-content` globally — the focus ring is intentional for keyboard navigation

---

## Supply Chain Security

We take package integrity seriously.

| Measure                    | Status                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **npm package provenance** | ✅ Enabled — every publish includes [provenance attestations](https://docs.npmjs.com/generating-provenance-statements) via GitHub Actions and Sigstore. |
| **CI/CD**                  | ✅ GitHub Actions runs `npm ci` → `npm test` → `npm run build` → publish on every push to `dev` and `main`.                                             |
| **Prerelease tags**        | ✅ Non‑main branches publish with a `dev` dist‑tag (e.g. `1.1.3-dev.abc1234`).                                                                          |
| **Dependabot**             | 🔜 Planned — automated dependency update PRs will be enabled via `.github/dependabot.yml`.                                                              |

To verify provenance locally:

```bash
npm audit signatures
```

---

## Contributing

We welcome contributions! Please follow the guidelines below.

### PR Policy

1. **Fork** the repository and create a feature branch off `dev`.
2. **Keep changes focused** — one feature or fix per PR.
3. **Add tests** for any new functionality. The project uses [Vitest](https://vitest.dev/) + [`@vue/test-utils`](https://test-utils.vuejs.org/).
4. **Run the full check** before pushing:

   ```bash
   npm ci
   npm run test
   npm run type-check
   npm run build
   ```

5. **Open a PR** against the `dev` branch with a clear description of what changed and why.

### Dev setup

```bash
# Clone and install
git clone https://github.com/danielgran/vue-markdown-editor.git
cd vue-markdown-editor
npm ci

# Start the dev server
npm run dev
```

The dev server launches at `http://localhost:4010`. The entry point is `dev/App.vue` — a full showcase that demonstrates every editor feature: block types, drag & drop, image upload, context menus, keyboard navigation, and Markdown output serialization. Use it as a playground while developing.

---

## License

[ISC](LICENSE) © 2026 [danielgran](https://github.com/danielgran)

All components use scoped SCSS. To override styles, use **global CSS** with higher specificity, or Vue's `:deep()` combinator from a parent component.

### CSS class reference

| Class                                       | Applies to                                           |
| ------------------------------------------- | ---------------------------------------------------- |
| `.markdown-editor`                          | Root editor container                                |
| `.markdown-editor-module`                   | Individual block wrapper — `.is-focused` when active |
| `.markdown-editor-module-controls`          | Left control bar (drag handle + add/delete buttons)  |
| `.markdown-editor-module-content`           | Content area inside a block                          |
| `.markdown-editor-module-content-focused`   | Content area when the block is focused               |
| `.markdown-editor-focus-controls`           | Row containing drag‑handle, delete, and add buttons  |
| `.drag-handle`                              | SortableJS drag handle (⠿)                           |
| `.focus-control-btn`                        | Delete / Add buttons in the control bar              |
| `.markdown-editor-context-menu`             | Floating block context menu (`z-index: 1000`)        |
| `.markdown-editor-context-menu-block-item`  | Full‑width context menu button                       |
| `.markdown-editor-context-menu-inline-item` | Inline toolbar button (`.is-active` when toggled)    |
| `.markdown-editor-modal-overlay`            | Modal backdrop (`z-index: 9999`)                     |
| `.markdown-editor-modal`                    | Modal container                                      |
| `.markdown-editor-modal-header`             | Modal title bar                                      |
| `.markdown-editor-modal-title`              | Modal heading text                                   |
| `.markdown-editor-modal-close`              | Close (✕) button                                     |
| `.markdown-editor-modal-body`               | Modal content area                                   |
| `.markdown-editor-modal-footer`             | Modal action bar                                     |
| `.markdown-editor-modal-button`             | Base modal button                                    |
| `.markdown-editor-modal-button-primary`     | Primary (Save) button — blue                         |
| `.markdown-editor-modal-button-secondary`   | Secondary (Cancel) button — gray                     |
| `.markdown-module-image`                    | Image block wrapper                                  |
| `.markdown-module-image-form`               | Image edit form inside the modal                     |
| `.markdown-module-image-form-field`         | Form field group (label + input)                     |

### Styling TipTap content

Each text‑based block hosts its own TinyMCE‑style TipTap editor. Target `.tiptap` inside a block's content area:

```css
/* Make all TipTap editors use your font */
.markdown-editor-module-content .tiptap {
  font-family: "Georgia", serif;
  font-size: 1.1rem;
  line-height: 1.8;
}
```

### Do's

- ✅ Import the stylesheet: `import "@grandaniel/vue-markdown-editor/style.css"`
- ✅ Use **global** (unscoped) CSS or `:deep()` from a parent to override styles
- ✅ Target `.tiptap` inside `.markdown-editor-module-content` for editor typography
- ✅ Use `z-index` values above `1000` / `9999` for anything that must layer **above** context menus and modals

### Don'ts

- ❌ Don't rely on CSS custom properties — the editor uses hard‑coded Tailwind‑scale colors (grays and blues)
- ❌ Don't override `z-index` on `.markdown-editor-context-menu` or `.markdown-editor-modal-overlay` — it will break layering
- ❌ Don't use `display: contents` on `.markdown-editor-module` — it interferes with SortableJS drag logic
- ❌ Don't set `outline: none` on `.markdown-editor-module-content` globally — the focus ring is intentional for keyboard navigation

---

## Supply Chain Security

We take package integrity seriously.

| Measure                    | Status                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **npm package provenance** | ✅ Enabled — every publish includes [provenance attestations](https://docs.npmjs.com/generating-provenance-statements) via GitHub Actions and Sigstore. |
| **CI/CD**                  | ✅ GitHub Actions runs `npm ci` → `npm test` → `npm run build` → publish on every push to `dev` and `main`.                                             |
| **Prerelease tags**        | ✅ Non‑main branches publish with a `dev` dist‑tag (e.g. `1.1.3-dev.abc1234`).                                                                          |
| **Dependabot**             | 🔜 Planned — automated dependency update PRs will be enabled via `.github/dependabot.yml`.                                                              |

To verify provenance locally:

```bash
npm audit signatures
```

---

## Contributing

We welcome contributions! Please follow the guidelines below.

### PR Policy

1. **Fork** the repository and create a feature branch off `dev`.
2. **Keep changes focused** — one feature or fix per PR.
3. **Add tests** for any new functionality. The project uses [Vitest](https://vitest.dev/) + [`@vue/test-utils`](https://test-utils.vuejs.org/).
4. **Run the full check** before pushing:

   ```bash
   npm ci
   npm run test
   npm run type-check
   npm run build
   ```

5. **Open a PR** against the `dev` branch with a clear description of what changed and why.

### Dev setup

```bash
# Clone and install
git clone https://github.com/danielgran/vue-markdown-editor.git
cd vue-markdown-editor
npm ci

# Start the dev server
npm run dev
```

The dev server launches at `http://localhost:4010`. The entry point is `dev/App.vue` — a full showcase that demonstrates every editor feature: block types, drag & drop, image upload, context menus, keyboard navigation, and Markdown output serialization. Use it as a playground while developing.

---

## License

[ISC](LICENSE) © 2026 [danielgran](https://github.com/danielgran)
