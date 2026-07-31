import { describe, expect, it } from "vitest";
import MarkdownModuleFileState from "../MarkdownModuleFileState";

describe("MarkdownModuleFileState", () => {
  it("constructs with all fields", () => {
    // Act
    const state = new MarkdownModuleFileState({
      url: "https://example.com/file.pdf",
      fileName: "document.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      uploadError: "",
    });

    // Assert
    expect(state.url).toBe("https://example.com/file.pdf");
    expect(state.fileName).toBe("document.pdf");
    expect(state.fileSize).toBe(1024);
    expect(state.mimeType).toBe("application/pdf");
    expect(state.uploadError).toBe("");
  });

  it("constructs with uploadError set", () => {
    // Act
    const state = new MarkdownModuleFileState({
      url: "",
      fileName: "report.xlsx",
      fileSize: 2048,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      uploadError: "Network error",
    });

    // Assert
    expect(state.url).toBe("");
    expect(state.uploadError).toBe("Network error");
  });

  it("constructs with zero file size", () => {
    // Act
    const state = new MarkdownModuleFileState({
      url: "",
      fileName: "empty.txt",
      fileSize: 0,
      mimeType: "text/plain",
      uploadError: "",
    });

    // Assert
    expect(state.fileSize).toBe(0);
  });
});
