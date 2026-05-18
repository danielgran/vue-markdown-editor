<template>
  <div
    ref="divRef"
    class="markdown-module-image"
    @click="handleClick"
  >
    <img
      :src="modelValue.src"
      :alt="modelValue.alt"
    >
    <span v-if="modelValue.alt">{{ modelValue.caption }}</span>

    <MarkdownEditorImageContextMenu
      v-if="showContextMenu"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      @edit-attributes="openAttributesModal"
    />

    <MarkdownEditorModal
      :show="showModal"
      title="Edit Image Attributes"
      @close="closeModal"
      @confirm="saveAttributes"
    >
      <div class="markdown-module-image-form">
        <div class="markdown-module-image-form-field">
          <label for="image-src">Image Source (URL)</label>
          <input
            id="image-src"
            v-model="editForm.src"
            type="text"
            placeholder="https://example.com/image.jpg"
          >
        </div>

        <div class="markdown-module-image-form-field">
          <label for="image-alt">Alt Text</label>
          <input

            id="image-alt"
            v-model="editForm.alt"
            type="text"
            placeholder="Description of the image"
          >
        </div>

        <div class="markdown-module-image-form-field">
          <label for="image-caption">Caption</label>
          <input
            id="image-caption"
            v-model="editForm.caption"
            type="text"
            placeholder="Optional caption"
          >
        </div>
      </div>
    </MarkdownEditorModal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import MarkdownEditorModal from "../MarkdownEditorModal.vue";
import type MarkdownModuleImageState from "./MarkdownModuleImageState";

const divRef = ref<HTMLDivElement>();

const modelValue = defineModel<MarkdownModuleImageState>({
  required: true,
});

// Context menu state
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// Modal state
const showModal = ref(false);
const editForm = ref({
  src: "",
  alt: "",
  caption: "",
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
    src: modelValue.value.src || "",
    alt: modelValue.value.alt || "",
    caption: modelValue.value.caption || "",
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function saveAttributes() {
  modelValue.value.src = editForm.value.src;
  modelValue.value.alt = editForm.value.alt;
  modelValue.value.caption = editForm.value.caption;
  showModal.value = false;
}

function focus() {
  if (divRef.value) {
    divRef.value.focus();
  }
}

defineExpose({ focus });
</script>

<style lang="scss" scoped>
.markdown-module-image {
  cursor: pointer;
  position: relative;
  text-align: center;

  img {
    max-width: 100%;
    height: auto;
  }

  span {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
}

.markdown-module-image-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.markdown-module-image-form-field {
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
