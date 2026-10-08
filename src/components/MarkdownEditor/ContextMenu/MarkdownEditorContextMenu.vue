<template>
  <Teleport to="body">
    <div
      ref="rootEl"
      v-bind="$attrs"
      class="markdown-editor-context-menu"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, toRef } from "vue";
import useFloatingPosition, { type FloatingPlacement } from "../Composable/useFloatingPosition";

defineOptions({ inheritAttrs: false });

const rootEl = ref<HTMLElement | null>(null);

defineExpose({ rootEl });

const props = defineProps<{
  x: number;
  y: number;
  placement?: FloatingPlacement;
  /**
   * Element the point belongs to. With an anchor the menu keeps its place while the
   * page scrolls, without one the point is taken as it is.
   */
  anchor?: HTMLElement | null;
}>();

useFloatingPosition({
  x: toRef(props, "x"),
  y: toRef(props, "y"),
  anchor: toRef(props, "anchor"),
  placement: toRef(props, "placement"),
  floatingRef: rootEl,
});
</script>

<style lang="scss" scoped>
.markdown-editor-context-menu {
  position: fixed;
  z-index: 1000;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 0.25rem;
  display: flex;
  gap: 0.25rem;
}
</style>
