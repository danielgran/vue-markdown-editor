import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleListState from "../MarkdownModuleListState";
import MarkdownModuleTextState from "../MarkdownModuleTextState";
import MarkdownModuleList from "../MarkdownModuleList.vue";

describe("MarkdownModuleList", () => {
  describe("rendering", () => {
    it("renders correctly with empty items", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleList, {
        props: {
          modelValue: new MarkdownModuleListState({ items: [] }),
        },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders correctly with items", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleList, {
        props: {
          modelValue: new MarkdownModuleListState({
            items: [
              new MarkdownModuleTextState({ text: "First item" }),
              new MarkdownModuleTextState({ text: "Second item" }),
            ],
          }),
        },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
