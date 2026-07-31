<template>
  <div class="markdown-module-file-render">
    <span class="markdown-module-file-render-icon">{{ fileIcon }}</span>
    <div class="markdown-module-file-render-info">
      <a
        :href="state.url"
        target="_blank"
        rel="noopener noreferrer"
        :download="state.fileName"
        class="markdown-module-file-render-name"
      >{{ state.fileName }}</a>
      <span class="markdown-module-file-render-size">{{ formattedFileSize }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type MarkdownModuleFileState from "../../MarkdownEditor/Modules/MarkdownModuleFileState";

const props = defineProps<{ state: MarkdownModuleFileState }>();

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
      return props.state.mimeType.startsWith(key);
    }
    return props.state.mimeType === key;
  });

  return match?.[1] ?? "📎";
});

const formattedFileSize = computed(() => {
  const bytes = props.state.fileSize;
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
});
</script>

<style lang="scss" scoped>
.markdown-module-file-render {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
}

.markdown-module-file-render-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.markdown-module-file-render-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.markdown-module-file-render-name {
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

.markdown-module-file-render-size {
  font-size: 0.75rem;
  color: #6b7280;
}
</style>
