import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownEditorFocusControls from "../MarkdownEditorFocusControls.vue";

describe("MarkdownEditorFocusControls", () => {
  describe("rendering", () => {
    it("renders the drag handle and both action buttons", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorFocusControls);

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
