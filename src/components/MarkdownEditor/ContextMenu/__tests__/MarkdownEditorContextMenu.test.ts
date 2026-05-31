import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownEditorContextMenu from "../MarkdownEditorContextMenu.vue";

describe("MarkdownEditorContextMenu", () => {
  describe("placement: below (default)", () => {
    it("renders with left/top inline styles when no placement is given", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x: 100, y: 200 },
        global: { stubs: { Teleport: true } },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("placement: above", () => {
    it("renders with transform translateY above anchor when placement is 'above'", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x: 300, y: 150, placement: "above" },
        global: { stubs: { Teleport: true } },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("slot content", () => {
    it("renders default slot content", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x: 0, y: 0 },
        slots: { default: "<span>Menu Item</span>" },
        global: { stubs: { Teleport: true } },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
