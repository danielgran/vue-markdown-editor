import { onMounted, onUnmounted, ref } from "vue";

export interface TextSelectionActiveStates {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface TextSelectionMenuState {
  isVisible: ReturnType<typeof ref<boolean>>;
  anchorX: ReturnType<typeof ref<number>>;
  anchorY: ReturnType<typeof ref<number>>;
  activeStates: ReturnType<typeof ref<TextSelectionActiveStates>>;
  hide: () => void;
}

function isElementOrParentTagName(element: HTMLElement, tagNames: string[]): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    if (tagNames.includes(current.tagName)) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function useTextSelectionMenu() {
  const isVisible = ref(false);
  const anchorX = ref(0);
  const anchorY = ref(0);
  const activeStates = ref<TextSelectionActiveStates>({
    bold: false,
    italic: false,
    underline: false,
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function updateFromSelection() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
      isVisible.value = false;
      return;
    }

    if (selection.rangeCount === 0) {
      isVisible.value = false;
      return;
    }

    // Capture rect immediately — do not defer, as the selection may collapse
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      isVisible.value = false;
      return;
    }

    anchorX.value = rect.left + rect.width / 2;
    anchorY.value = rect.top;

    const parentElement = range.commonAncestorContainer.parentElement;
    if (parentElement) {
      activeStates.value = {
        bold: isElementOrParentTagName(parentElement, ["STRONG", "B"]),
        italic: isElementOrParentTagName(parentElement, ["EM", "I"]),
        underline: isElementOrParentTagName(parentElement, ["U"]),
      };
    }

    isVisible.value = true;
  }

  function handleSelectionChange() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateFromSelection, 100);
  }

  function handleMouseDown(event: MouseEvent) {
    // Hide when clicking outside a contenteditable
    const target = event.target as HTMLElement | null;
    if (!target?.isContentEditable) {
      hide();
    }
  }

  function hide() {
    isVisible.value = false;
  }

  onMounted(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mousedown", handleMouseDown);
  });

  onUnmounted(() => {
    document.removeEventListener("selectionchange", handleSelectionChange);
    document.removeEventListener("mousedown", handleMouseDown);
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return { isVisible, anchorX, anchorY, activeStates, hide };
}

export default useTextSelectionMenu;
