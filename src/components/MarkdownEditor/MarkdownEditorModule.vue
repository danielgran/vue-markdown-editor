<template>
  <div
    ref="markdownEditorModuleRef"
    class="markdown-editor-module"
  >
    <div class="markdown-editor-module-controls">
      <template v-if="focused || mouseOver">
        <slot name="focus-controls" />
      </template>
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
import { useFocusWithin, useMouseInElement } from "@vueuse/core";
import { computed, onMounted, ref, useTemplateRef, watch, type PropType } from "vue";
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

onMounted(() => {
  if (moduleComponentRef.value && props.focused) {
    moduleComponentRef.value.focus();
  }
});

const emit = defineEmits<{
  "focus": [];
  "update:cursor-position": [number];
  "update:node": [Record<string, unknown>];
  "change-type": [MarkdownAstNode, number];
}>();

const markdownEditorModuleRef = useTemplateRef("markdownEditorModuleRef");
const contentRef = useTemplateRef("contentRef");
const moduleComponentRef = ref<{ focus: () => void } | null>(null);
const innerElementFocus = useFocusWithin(contentRef);
const mouseInTarget = useMouseInElement(markdownEditorModuleRef);
const mouseOver = computed(() => !mouseInTarget.isOutside.value);

// Handle external focus changes
watch(
  () => props.focused,
  (nowFocused) => {
    if (nowFocused && moduleComponentRef.value) {
      moduleComponentRef.value.focus();
    }
  },
);

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
  gap: 1rem;

  :deep(.tiptap) {
    outline: none;
  }

  .markdown-editor-module-content {
    width: 100%;
    outline: none;
  }

  .drag-handle {
    cursor: grab;
    padding: 0 0.25rem;
    user-select: none;
    font-size: 1rem;
    opacity: 0.5;

    &:active {
      cursor: grabbing;
    }
  }

  .markdown-editor-module-controls {
    width: 6rem;
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
    align-items: center;
  }

  .markdown-editor-module-content-focused {
    background-color: rgba(158, 149, 149, 0.05);
  }
}
</style>
