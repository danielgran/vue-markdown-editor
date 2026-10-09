import {
  computed, ref, type ComputedRef, type Ref,
} from "vue";
import {
  filterSlashCommands, type SlashCommand,
} from "../SlashMenu/slashCommands";

export interface SlashMenuAnchor {
  x: number;
  y: number;
}

export interface SlashMenuOptions {
  /** All commands the menu may offer, read reactively. */
  commands: () => SlashCommand[];
  /** Called when the user picks a command by click, Enter or Tab. */
  onSelect: (command: SlashCommand) => void;
}

export interface SlashMenu {
  isVisible: Ref<boolean>;
  query: Ref<string>;
  activeIndex: Ref<number>;
  anchorX: Ref<number>;
  anchorY: Ref<number>;
  items: ComputedRef<SlashCommand[]>;
  open: (query: string, anchor: SlashMenuAnchor) => void;
  close: () => void;
  moveActive: (delta: number) => void;
  setActiveIndex: (index: number) => void;
  handleKeydown: (event: KeyboardEvent) => boolean;
}

/** State of the `/` menu: which commands fit the typed query and which one is highlighted. */
function useSlashMenu(options: SlashMenuOptions): SlashMenu {
  const isVisible = ref(false);
  const query = ref("");
  const activeIndex = ref(0);
  const anchorX = ref(0);
  const anchorY = ref(0);

  const items = computed(() => filterSlashCommands(options.commands(), query.value));

  function open(newQuery: string, anchor: SlashMenuAnchor) {
    const queryChanged = newQuery !== query.value;

    query.value = newQuery;
    anchorX.value = anchor.x;
    anchorY.value = anchor.y;

    // A narrower query highlights the first match again, while keeping the menu
    // open across re-renders of the block must not reset the highlight.
    if (queryChanged || !isVisible.value) activeIndex.value = 0;

    isVisible.value = true;
  }

  function close() {
    isVisible.value = false;
    query.value = "";
    activeIndex.value = 0;
  }

  function moveActive(delta: number) {
    const itemCount = items.value.length;
    if (itemCount === 0) return;

    activeIndex.value = (activeIndex.value + delta + itemCount) % itemCount;
  }

  function setActiveIndex(index: number) {
    activeIndex.value = index;
  }

  function selectActive() {
    const command = items.value[activeIndex.value];
    if (command) options.onSelect(command);
  }

  /**
   * Handles the keys the menu owns while it is open. Returns whether the key was
   * consumed, so the host can keep it away from the block editor.
   */
  function handleKeydown(event: KeyboardEvent): boolean {
    if (!isVisible.value) return false;

    switch (event.key) {
      case "ArrowDown":
        moveActive(1);
        return true;
      case "ArrowUp":
        moveActive(-1);
        return true;
      case "Enter":
      case "Tab":
        selectActive();
        close();
        return true;
      case "Escape":
        close();
        return true;
      default:
        return false;
    }
  }

  return {
    isVisible,
    query,
    activeIndex,
    anchorX,
    anchorY,
    items,
    open,
    close,
    moveActive,
    setActiveIndex,
    handleKeydown,
  };
}

export default useSlashMenu;
