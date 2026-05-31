import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownEditorModal from "../MarkdownEditorModal.vue";

describe("MarkdownEditorModal", () => {
  describe("hidden state", () => {
    it("renders nothing when show is false", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorModal, {
        props: { show: false, title: "Test Modal" },
        global: { stubs: { Teleport: true } },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("visible state", () => {
    it("renders the modal with title and slot content when show is true", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorModal, {
        props: { show: true, title: "Edit Image Attributes" },
        slots: { default: "<p>Modal body content</p>" },
        global: { stubs: { Teleport: true } },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders with a different title", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorModal, {
        props: { show: true, title: "Confirm Delete" },
        global: { stubs: { Teleport: true } },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
