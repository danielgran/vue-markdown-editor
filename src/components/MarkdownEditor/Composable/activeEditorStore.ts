import { shallowRef, type ShallowRef } from "vue";
import type { Editor } from "@tiptap/vue-3";

/**
 * Singleton reactive reference to the currently focused TipTap editor.
 * Set by each TipTap module on focus, read by the text selection context menu.
 */
export const activeEditor: ShallowRef<Editor | null> = shallowRef<Editor | null>(null);
