import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownEditorContextMenuInlineItem from "../MarkdownEditorContextMenuInlineItem.vue";

describe("MarkdownEditorContextMenuInlineItem", () => {
  describe("inactive state", () => {
    it("renders without active class when active prop is false", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenuInlineItem, {
        props: { active: false },
        slots: { default: "<strong>B</strong>" },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("active state", () => {
    it("renders with active class when active prop is true", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenuInlineItem, {
        props: { active: true },
        slots: { default: "<strong>B</strong>" },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("default slot", () => {
    it("renders slot content inside the button", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenuInlineItem, {
        props: {},
        slots: { default: "<em>I</em>" },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
