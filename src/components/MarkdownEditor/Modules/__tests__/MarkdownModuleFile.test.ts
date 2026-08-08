import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleFileState from "../MarkdownModuleFileState";
import MarkdownModuleFile from "../MarkdownModuleFile.vue";

describe("MarkdownModuleFile", () => {
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
    it("renders success state with download card", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState() },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });

    it("renders loading state when url is empty and no error", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState({ url: "", uploadError: "" }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-card--loading").exists()).toBe(true);
      expect(wrapper.find(".markdown-module-file-loading-text").text()).toContain("Uploading document.pdf");
    });

    it("renders error state with retry button", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState({ url: "", uploadError: "Network error" }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-card--error").exists()).toBe(true);
      expect(wrapper.find(".markdown-module-file-error-text").text()).toBe("Network error");
      expect(wrapper.find(".markdown-module-file-retry-btn").exists()).toBe(true);
    });

    it("formats file size correctly for bytes", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState({ fileSize: 512 }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-size").text()).toBe("512 B");
    });

    it("formats file size correctly for KB", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState({ fileSize: 1536 }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-size").text()).toBe("1.5 KB");
    });

    it("formats file size correctly for MB", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState({ fileSize: 1048576 }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-size").text()).toBe("1.0 MB");
    });

    it("displays correct file icon for known MIME type", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState({ mimeType: "application/pdf" }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-icon").text()).toBe("📄");
    });

    it("displays default file icon for unknown MIME type", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: makeFileState({ mimeType: "application/octet-stream" }) },
      });

      // Assert
      expect(wrapper.find(".markdown-module-file-icon").text()).toBe("📎");
    });
  });

  describe("emit", () => {
    it("emits retry-upload when retry button is clicked in error state", async () => {
      // Arrange
      const fileState = makeFileState({ url: "", uploadError: "Upload failed" });
      const wrapper = shallowMount(MarkdownModuleFile, {
        props: { modelValue: fileState },
      });

      // Act
      await wrapper.find(".markdown-module-file-retry-btn").trigger("click");

      // Assert
      expect(wrapper.emitted("retry-upload")).toHaveLength(1);
      expect(wrapper.emitted("retry-upload")![0]).toEqual([fileState]);
    });
  });
});
