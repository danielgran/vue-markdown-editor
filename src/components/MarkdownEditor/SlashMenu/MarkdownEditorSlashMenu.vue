<template>
  <Teleport to="body">
    <div
      ref="rootEl"
      class="markdown-editor-slash-menu"
    >
      <button
        v-for="(item, index) in items"
        :key="item.id"
        type="button"
        class="slash-menu-item"
        :class="{ 'is-active': index === activeIndex }"
        @mousedown.prevent="emit('select', item)"
        @mouseenter="emit('update:activeIndex', index)"
      >
        <span class="slash-menu-item-icon">{{ item.icon }}</span>
        <span class="slash-menu-item-text">
          <span class="slash-menu-item-title">{{ item.title }}</span>
          <span
            v-if="item.description"
            class="slash-menu-item-description"
          >{{ item.description }}</span>
        </span>
      </button>
      <p
        v-if="items.length === 0"
        class="slash-menu-empty"
      >
        No matching blocks
      </p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, toRef } from "vue";
import useFloatingPosition from "../Composable/useFloatingPosition";
import type { SlashCommand } from "./slashCommands";

const props = defineProps<{
  items: SlashCommand[];
  activeIndex: number;
  x: number;
  y: number;
  /**
   * Block the menu belongs to. The menu is anchored to it, so it stays below the
   * block while the page scrolls.
   */
  anchor?: HTMLElement | null;
}>();

const emit = defineEmits<{
  "select": [command: SlashCommand];
  "update:activeIndex": [index: number];
}>();

const rootEl = ref<HTMLElement | null>(null);

useFloatingPosition({
  x: toRef(props, "x"),
  y: toRef(props, "y"),
  anchor: toRef(props, "anchor"),
  floatingRef: rootEl,
});
</script>

<style lang="scss" scoped>
.markdown-editor-slash-menu {
  position: fixed;
  z-index: 1000;
  min-width: 14rem;
  max-width: 20rem;
  max-height: 18rem;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  .slash-menu-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
    text-align: left;
    cursor: pointer;

    &.is-active {
      background: rgba(158, 149, 149, 0.15);
    }
  }

  .slash-menu-item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    flex-shrink: 0;
    border: 1px solid #e5e7eb;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    line-height: 1;
  }

  .slash-menu-item-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .slash-menu-item-title {
    font-size: 0.875rem;
    color: #111827;
  }

  .slash-menu-item-description {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .slash-menu-empty {
    margin: 0;
    padding: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
}
</style>
