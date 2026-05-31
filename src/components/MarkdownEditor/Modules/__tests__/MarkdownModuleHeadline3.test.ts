import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleTextState from "../MarkdownModuleTextState";
import MarkdownModuleHeadline3 from "../MarkdownModuleHeadline3.vue";

describe("MarkdownModuleHeadline3", () => {
  describe("rendering", () => {
    it("renders correctly with an empty text state", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleHeadline3, {
        props: { modelValue: new MarkdownModuleTextState({ text: "" }) },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders correctly with text content", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleHeadline3, {
        props: { modelValue: new MarkdownModuleTextState({ text: "Sub-section" }) },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
