import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownEditorImageContextMenu from "../MarkdownEditorImageContextMenu.vue";

describe("MarkdownEditorImageContextMenu", () => {
  describe("rendering", () => {
    it("renders correctly with x and y position props", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorImageContextMenu, {
        props: { x: 50, y: 120 },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("position variants", () => {
    it("renders with zero position", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorImageContextMenu, {
        props: { x: 0, y: 0 },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
