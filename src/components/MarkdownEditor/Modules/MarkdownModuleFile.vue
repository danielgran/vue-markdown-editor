<template>
  <div
    ref="divRef"
    class="markdown-module-file"
    @click="handleClick"
  >
    <!-- Success state: download card -->
    <div
      v-if="modelValue.url && !modelValue.uploadError"
      class="markdown-module-file-card"
    >
      <span class="markdown-module-file-icon">{{ fileIcon }}</span>
      <div class="markdown-module-file-info">
        <a
          :href="modelValue.url"
          target="_blank"
          rel="noopener noreferrer"
          :download="modelValue.fileName"
          class="markdown-module-file-name"
          @click.stop
        >{{ modelValue.fileName }}</a>
        <span class="markdown-module-file-size">{{ formattedFileSize }}</span>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="modelValue.uploadError"
      class="markdown-module-file-card markdown-module-file-card--error"
    >
      <span class="markdown-module-file-icon">⚠️</span>
      <div class="markdown-module-file-info">
        <span class="markdown-module-file-error-text">{{ modelValue.uploadError }}</span>
        <span class="markdown-module-file-name">{{ modelValue.fileName }}</span>
        <button
          type="button"
          class="markdown-module-file-retry-btn"
          @click.stop="handleRetry"
        >
          Retry Upload
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-else
      class="markdown-module-file-card markdown-module-file-card--loading"
    >
      <span class="markdown-module-file-spinner" />
      <div class="markdown-module-file-info">
        <span class="markdown-module-file-loading-text">Uploading {{ modelValue.fileName }}...</span>
      </div>
    </div>

    <MarkdownEditorFileContextMenu
      v-if="showContextMenu"
      ref="contextMenuRef"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      @edit-attributes="openAttributesModal"
      @download="handleDownload"
      @retry="handleRetry"
      @close="() => showContextMenu = false"
    />

    <MarkdownEditorModal
      :show="showModal"
      title="Edit File Attributes"
      @close="closeModal"
      @confirm="saveAttributes"
    >
      <div class="markdown-module-file-form">
        <div class="markdown-module-file-form-field">
          <label for="file-url">File URL</label>
          <input
            id="file-url"
            v-model="editForm.url"
            type="text"
            placeholder="https://example.com/file.pdf"
          >
        </div>

        <div class="markdown-module-file-form-field">
          <label for="file-name">File Name</label>
          <input
            id="file-name"
            v-model="editForm.fileName"
            type="text"
            placeholder="document.pdf"
          >
        </div>
      </div>
    </MarkdownEditorModal>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import MarkdownEditorFileContextMenu from "../ContextMenu/MarkdownEditorFileContextMenu.vue";
import MarkdownEditorModal from "../MarkdownEditorModal.vue";
import type MarkdownModuleFileState from "./MarkdownModuleFileState";

const divRef = ref<HTMLDivElement>();

const modelValue = defineModel<MarkdownModuleFileState>({
  required: true,
});

const emit = defineEmits<{
  "retry-upload": [fileState: MarkdownModuleFileState];
}>();

// Context menu state
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// Modal state
const showModal = ref(false);
const editForm = ref({
  url: "",
  fileName: "",
});

const fileIcon = computed(() => {
  const mimeMap: Record<string, string> = {
    "application/pdf": "📄",
    "application/zip": "📦",
    "application/gzip": "📦",
    "application/x-rar-compressed": "📦",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "📽",
    "application/msword": "📝",
    "application/vnd.ms-excel": "📊",
    "application/vnd.ms-powerpoint": "📽",
    "text/plain": "📋",
    "text/csv": "📋",
    "image/": "🖼",
    "video/": "🎬",
    "audio/": "🎵",
  };

  const match = Object.entries(mimeMap).find(([key]) => {
    if (key.endsWith("/")) {
      return modelValue.value.mimeType.startsWith(key);
    }
    return modelValue.value.mimeType === key;
  });

  return match?.[1] ?? "📎";
});

const formattedFileSize = computed(() => {
  const bytes = modelValue.value.fileSize;
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
});

function handleClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  contextMenuPosition.value = {
    x: event.clientX,
    y: rect.bottom + 5,
  };
  showContextMenu.value = true;
}

function openAttributesModal() {
  showContextMenu.value = false;
  editForm.value = {
    url: modelValue.value.url || "",
    fileName: modelValue.value.fileName || "",
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function saveAttributes() {
  modelValue.value.url = editForm.value.url;
  modelValue.value.fileName = editForm.value.fileName;
  showModal.value = false;
}

function handleDownload() {
  showContextMenu.value = false;
  if (modelValue.value.url) {
    const a = document.createElement("a");
    a.href = modelValue.value.url;
    a.download = modelValue.value.fileName;
    a.click();
  }
}

function handleRetry() {
  showContextMenu.value = false;
  emit("retry-upload", modelValue.value);
}

function focus() {
  if (divRef.value) {
    divRef.value.focus();
  }
}

defineExpose({ focus });
</script>

<style lang="scss" scoped>
.markdown-module-file {
  cursor: pointer;
  position: relative;

  &:focus {
    outline: none;
  }
}

.markdown-module-file-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: #3b82f6;
  }
}

.markdown-module-file-card--error {
  background: #fef2f2;
  border-color: #fecaca;
}

.markdown-module-file-card--loading {
  background: #f9fafb;
  border-color: #e5e7eb;
  cursor: default;
}

.markdown-module-file-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.markdown-module-file-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.markdown-module-file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: #3b82f6;
    text-decoration: underline;
  }
}

.markdown-module-file-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.markdown-module-file-error-text {
  font-size: 0.75rem;
  color: #dc2626;
}

.markdown-module-file-loading-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.markdown-module-file-retry-btn {
  margin-top: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #dc2626;
  background: transparent;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  width: fit-content;

  &:hover {
    background: #fef2f2;
    border-color: #f87171;
  }
}

.markdown-module-file-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: markdown-module-file-spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes markdown-module-file-spin {
  to {
    transform: rotate(360deg);
  }
}

.markdown-module-file-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.markdown-module-file-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  input {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: #ffffff;
    color: #111827;
    transition: all 0.15s ease;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }
}
</style>

<style lang="scss" scoped>
@use "../Styles/Mixins.scss" as *;
@include reset-contenteditable;
</style>
