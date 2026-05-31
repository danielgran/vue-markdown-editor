import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleTextState from "../MarkdownModuleTextState";
import MarkdownModuleHeadline2 from "../MarkdownModuleHeadline2.vue";

describe("MarkdownModuleHeadline2", () => {
  describe("rendering", () => {
    it("renders correctly with an empty text state", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleHeadline2, {
        props: { modelValue: new MarkdownModuleTextState({ text: "" }) },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders correctly with text content", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleHeadline2, {
        props: { modelValue: new MarkdownModuleTextState({ text: "Section Title" }) },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
