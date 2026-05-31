import { shallowMount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock useTextSelectionMenu (second-layer dep) ---
const mockIsVisible = ref(false);
const mockAnchorX = ref(0);
const mockAnchorY = ref(0);
const mockActiveStates = ref({ bold: false, italic: false, underline: false });
const mockHide = vi.fn();

vi.mock("../../Composable/useTextSelectionMenu", () => ({
  default: vi.fn(() => ({
    isVisible: mockIsVisible,
    anchorX: mockAnchorX,
    anchorY: mockAnchorY,
    activeStates: mockActiveStates,
    hide: mockHide,
  })),
}));

import MarkdownEditorTextSelectionContextMenu from "../MarkdownEditorTextSelectionContextMenu.vue";

describe("MarkdownEditorTextSelectionContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsVisible.value = false;
    mockAnchorX.value = 0;
    mockAnchorY.value = 0;
    mockActiveStates.value = { bold: false, italic: false, underline: false };
  });

  describe("hidden state", () => {
    it("renders nothing when isVisible is false", () => {
      // Arrange
      mockIsVisible.value = false;

      // Act
      const wrapper = shallowMount(MarkdownEditorTextSelectionContextMenu);

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("visible state — no active formatting", () => {
    it("renders the context menu above the anchor point when visible", () => {
      // Arrange
      mockIsVisible.value = true;
      mockAnchorX.value = 400;
      mockAnchorY.value = 250;

      // Act
      const wrapper = shallowMount(MarkdownEditorTextSelectionContextMenu);

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("visible state — bold active", () => {
    it("renders with bold active state", () => {
      // Arrange
      mockIsVisible.value = true;
      mockActiveStates.value = { bold: true, italic: false, underline: false };

      // Act
      const wrapper = shallowMount(MarkdownEditorTextSelectionContextMenu);

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("visible state — all active", () => {
    it("renders with all formatting active", () => {
      // Arrange
      mockIsVisible.value = true;
      mockActiveStates.value = { bold: true, italic: true, underline: true };

      // Act
      const wrapper = shallowMount(MarkdownEditorTextSelectionContextMenu);

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
