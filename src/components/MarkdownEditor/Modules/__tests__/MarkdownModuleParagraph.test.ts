import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleTextState from "../MarkdownModuleTextState";
import MarkdownModuleParagraph from "../MarkdownModuleParagraph.vue";

describe("MarkdownModuleParagraph", () => {
  describe("rendering", () => {
    it("renders correctly with an empty text state", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleParagraph, {
        props: { modelValue: new MarkdownModuleTextState({ text: "" }) },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders correctly with text content", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleParagraph, {
        props: { modelValue: new MarkdownModuleTextState({ text: "Some paragraph text" }) },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
