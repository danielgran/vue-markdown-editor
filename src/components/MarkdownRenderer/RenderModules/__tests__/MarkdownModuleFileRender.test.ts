import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleFileState from "../../../MarkdownEditor/Modules/MarkdownModuleFileState";
import MarkdownModuleFileRender from "../MarkdownModuleFileRender.vue";

describe("MarkdownModuleFileRender", () => {
  function makeFileState(overrides: Partial<MarkdownModuleFileState> = {}) {
    return new MarkdownModuleFileState({
      url: "https://example.com/document.pdf",
      fileName: "document.pdf",
      fileSize: 1048576,
      mimeType: "application/pdf",
      uploadError: "",
      ...overrides,
    });
  }

  describe("rendering", () => {
    it("renders download card with file info", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFileRender, {
        props: { state: makeFileState() },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders file name as a link", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFileRender, {
        props: { state: makeFileState() },
      });

      // Assert
      const link = wrapper.find("a");
      expect(link.exists()).toBe(true);
      expect(link.text()).toBe("document.pdf");
      expect(link.attributes("href")).toBe("https://example.com/document.pdf");
      expect(link.attributes("download")).toBe("document.pdf");
    });

    it("renders correct icon for PDF", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFileRender, {
        props: { state: makeFileState({ mimeType: "application/pdf" }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-render-icon").text()).toBe("📄");
    });

    it("formats file size", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFileRender, {
        props: { state: makeFileState({ fileSize: 2048 }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-render-size").text()).toBe("2.0 KB");
    });
  });
});
