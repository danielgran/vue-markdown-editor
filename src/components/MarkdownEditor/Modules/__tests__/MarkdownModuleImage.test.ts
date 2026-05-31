import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleImageState from "../MarkdownModuleImageState";
import MarkdownModuleImage from "../MarkdownModuleImage.vue";

describe("MarkdownModuleImage", () => {
  function makeImageState(overrides: Partial<MarkdownModuleImageState> = {}) {
    return new MarkdownModuleImageState({
      src: "https://example.com/image.png",
      alt: "An example image",
      caption: "A caption",
      ...overrides,
    });
  }

  describe("rendering", () => {
    it("renders correctly with full image state", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleImage, {
        props: { modelValue: makeImageState() },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders correctly with empty src and alt", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleImage, {
        props: { modelValue: makeImageState({ src: "", alt: "", caption: "" }) },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
