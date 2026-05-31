import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownEditorContextMenuBlockItem from "../MarkdownEditorContextMenuBlockItem.vue";

describe("MarkdownEditorContextMenuBlockItem", () => {
  describe("rendering", () => {
    it("renders correctly with default slot content", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenuBlockItem, {
        slots: { default: "Edit Attributes" },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("slot content", () => {
    it("renders arbitrary slot content inside the button", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenuBlockItem, {
        slots: { default: "<span>Custom Action</span>" },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
