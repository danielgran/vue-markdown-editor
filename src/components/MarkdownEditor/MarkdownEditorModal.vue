<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="markdown-editor-modal-overlay"
      @click.self="emit('close')"
    >
      <div class="markdown-editor-modal">
        <div class="markdown-editor-modal-header">
          <h3 class="markdown-editor-modal-title">
            {{ title }}
          </h3>
          <button
            type="button"
            class="markdown-editor-modal-close"
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <div class="markdown-editor-modal-body">
          <slot />
        </div>

        <div class="markdown-editor-modal-footer">
          <button
            type="button"
            class="markdown-editor-modal-button markdown-editor-modal-button-secondary"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="markdown-editor-modal-button markdown-editor-modal-button-primary"
            @click="emit('confirm')"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  title: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<style lang="scss" scoped>
.markdown-editor-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.markdown-editor-modal {
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.markdown-editor-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-editor-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.markdown-editor-modal-close {
  background: transparent;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.15s ease;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
}

.markdown-editor-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.markdown-editor-modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.markdown-editor-modal-button {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.98);
  }
}

.markdown-editor-modal-button-secondary {
  background: #f3f4f6;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }
}

.markdown-editor-modal-button-primary {
  background: #3b82f6;
  color: #ffffff;

  &:hover {
    background: #2563eb;
  }
}
</style>
