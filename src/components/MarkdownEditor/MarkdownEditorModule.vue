<template>
  <div
    ref="markdownEditorModuleRef"
    class="markdown-editor-module"
    :class="{ 'is-focused': props.focused }"
  >
    <div class="markdown-editor-module-controls">
      <slot name="focus-controls" />
    </div>
    <div
      ref="contentRef"
      class="markdown-editor-module-content"
      :class="{
        'markdown-editor-module-content-focused': props.focused,
      }"
    >
      <component
        :is="ComponentRegistry[props.node.type].component"
        v-if="ComponentRegistry[props.node.type]"
        ref="moduleComponentRef"
        :model-value="props.node.componentState"
        @update:model-value="emit('update:node', $event)"
        @change-type="(newType: MarkdownAstNodeType) => emit('change-type', props.node, newType)"
        @update:cursor-position="emit('update:cursor-position', $event)"
        @click="emit('focus')"
      />
    </div>
    <slot name="after-controls" />
  </div>
</template>

<script lang="ts" setup>
import { useFocusWithin } from "@vueuse/core";
import {
  onMounted, ref, useTemplateRef, watch, type PropType,
} from "vue";
import type { MarkdownAstNode } from "./Types/MarkdownAstNode";

import ComponentRegistry from "./MarkdownComponentRegistry";
import type MarkdownAstNodeType from "./Types/MarkdownAstNodeType";

const props = defineProps({
  node: {
    type: Object as PropType<MarkdownAstNode>,
    required: true,
  },
  focused: {
    type: Boolean,
    required: true,
  },
});

let focusedOnce = false;

/**
 * The first focus of a module restores the caret its block was created with, so
 * a block that was rebuilt (e.g. merged with the one below) keeps the caret where
 * the user was. Later focuses keep the selection the user left in the block.
 */
function focusModule() {
  if (!moduleComponentRef.value) return;

  const { cursorPosition } = props.node.editingState;
  moduleComponentRef.value.focus(focusedOnce || cursorPosition <= 0 ? undefined : cursorPosition);
  focusedOnce = true;
}

onMounted(() => {
  if (props.focused) focusModule();
});

const emit = defineEmits<{
  "focus": [];
  "update:cursor-position": [number];
  "update:node": [Record<string, unknown>];
  "change-type": [MarkdownAstNode, number];
}>();

const markdownEditorModuleRef = useTemplateRef("markdownEditorModuleRef");
const contentRef = useTemplateRef("contentRef");
const moduleComponentRef = ref<{ focus: (cursorPosition?: number) => void } | null>(null);
const innerElementFocus = useFocusWithin(contentRef);

// Handle external focus changes
watch(() => props.focused, (nowFocused) => {
  if (nowFocused) focusModule();
});

// Focus detection root
watch(innerElementFocus.focused, (isFocused) => {
  if (isFocused) {
    emit("focus");
  }
});
</script>

<style lang="scss" scoped>
.markdown-editor-module {
  display: flex;
  flex-direction: row;

  :deep(.tiptap) {
    outline: none;
  }

  .markdown-editor-module-content {
    width: 100%;
    outline: none;
  }

  .markdown-editor-module-controls {
    min-width: 5rem;
    max-width: 5rem;
    visibility: hidden;
  }

  &:hover {
    background: rgba(158, 149, 149, 0.05);
  }

  &:hover,
  &.is-focused {
    .markdown-editor-module-controls {
      visibility: visible;
    }
  }

  .markdown-editor-module-content-focused {
    background-color: rgba(158, 149, 149, 0.05);
  }
}
</style>
