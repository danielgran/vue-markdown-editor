import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownEditorFileContextMenu from "../MarkdownEditorFileContextMenu.vue";

describe("MarkdownEditorFileContextMenu", () => {
  describe("rendering", () => {
    it("renders correctly with x and y position props", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorFileContextMenu, {
        props: { x: 50, y: 120 },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders with zero position", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorFileContextMenu, {
        props: { x: 0, y: 0 },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
