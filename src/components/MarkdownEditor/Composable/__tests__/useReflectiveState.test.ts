import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MarkdownModuleTextState from "../../Modules/MarkdownModuleTextState";
import MarkdownNodeType from "../../Types/MarkdownAstNodeType";
import type { TextishEmitFunction } from "../../Types/TextishEmits";

// --- Mock second-layer deps: marked and turndown ---
vi.mock("marked", () => ({
  marked: {
    parseInline: vi.fn((md: string) => `<mock-html>${md}</mock-html>`),
  },
}));

vi.mock("turndown", () => {
  class MockTurndown {
    escape = (t: string) => t;
    addRule = vi.fn();
    turndown = vi.fn((html: string) => html.replace(/<[^>]+>/g, ""));
  }
  return { default: MockTurndown };
});

// Also mock detectHeadlineTypeFromContent as a second-layer dep
vi.mock("../HeadlineTypeMap", () => ({
  detectHeadlineTypeFromContent: vi.fn(() => null),
}));

import useReflectiveState from "../useReflectiveState";
import { detectHeadlineTypeFromContent } from "../HeadlineTypeMap";
import { marked } from "marked";

// --- Helpers ---
function makeTextState(text: string) {
  return new MarkdownModuleTextState({ text });
}

function makeModelRef(state: MarkdownModuleTextState) {
  return ref(state);
}

function makeEmit(): TextishEmitFunction & { calls: Array<[string, unknown]> } {
  const calls: Array<[string, unknown]> = [];
  const emit = vi.fn((event: string, value: unknown) => {
    calls.push([event, value]);
  }) as unknown as TextishEmitFunction & { calls: Array<[string, unknown]> };
  emit.calls = calls;
  return emit;
}

describe("useReflectiveState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(marked.parseInline).mockImplementation((md: string) => `<mock-html>${md}</mock-html>`);
    vi.mocked(detectHeadlineTypeFromContent).mockReturnValue(null);
  });

  describe("initialization", () => {
    it("converts initial markdown text to HTML via markdownToHtml for editorContent", () => {
      // Arrange
      const state = makeTextState("**bold**");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();

      // Act
      const { editorContent } = useReflectiveState({ modelRef, emit });

      // Assert — editorContent is initialized from the markdown→html conversion
      expect(editorContent.value).toContain("bold");
    });
  });

  describe("handleKeyDown", () => {
    it("prevents default on Enter key", () => {
      // Arrange
      const state = makeTextState("text");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const { handleKeyDown } = useReflectiveState({ modelRef, emit });
      const event = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      // Act
      handleKeyDown(event);

      // Assert
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("does not prevent default for non-Enter keys", () => {
      // Arrange
      const state = makeTextState("text");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const { handleKeyDown } = useReflectiveState({ modelRef, emit });
      const event = new KeyboardEvent("keydown", { key: "a", cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      // Act
      handleKeyDown(event);

      // Assert
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe("handleTipTapUpdateEvent", () => {
    it("updates model text by converting HTML to markdown", async () => {
      // Arrange
      const state = makeTextState("initial");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const { handleTipTapUpdateEvent } = useReflectiveState({ modelRef, emit });

      const fakeEditor = {
        getHTML: vi.fn(() => "<p>updated</p>"),
        commands: { focus: vi.fn() },
      };
      const fakeEvent = {
        editor: fakeEditor,
        transaction: { selection: { anchor: 5 } },
      };

      // Act
      await handleTipTapUpdateEvent(fakeEvent as never);

      // Assert
      expect(modelRef.value.text).toBe("updated");
    });

    it("emits 'update:model-value' with updated state after HTML change", async () => {
      // Arrange
      const state = makeTextState("initial");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const { handleTipTapUpdateEvent } = useReflectiveState({ modelRef, emit });

      const fakeEvent = {
        editor: { getHTML: vi.fn(() => "<p>new content</p>"), commands: { focus: vi.fn() } },
        transaction: { selection: { anchor: 8 } },
      };

      // Act
      await handleTipTapUpdateEvent(fakeEvent as never);

      // Assert
      expect(emit).toHaveBeenCalledWith("update:model-value", expect.objectContaining({ text: "new content" }));
    });

    it("emits 'update:cursor-position' with the anchor position", async () => {
      // Arrange
      const state = makeTextState("initial");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const { handleTipTapUpdateEvent } = useReflectiveState({ modelRef, emit });

      const fakeEvent = {
        editor: { getHTML: vi.fn(() => "<p>text</p>"), commands: { focus: vi.fn() } },
        transaction: { selection: { anchor: 12 } },
      };

      // Act
      await handleTipTapUpdateEvent(fakeEvent as never);

      // Assert
      expect(emit).toHaveBeenCalledWith("update:cursor-position", 12);
    });

    it("emits 'change-type' when detectHeadlineTypeFromContent returns a type", async () => {
      // Arrange
      vi.mocked(detectHeadlineTypeFromContent).mockReturnValue(MarkdownNodeType.HEADLINE1);

      const state = makeTextState("initial");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const { handleTipTapUpdateEvent } = useReflectiveState({ modelRef, emit });

      const fakeEvent = {
        editor: { getHTML: vi.fn(() => "<p>text</p>"), commands: { focus: vi.fn() } },
        transaction: { selection: { anchor: 3 } },
      };

      // Act
      await handleTipTapUpdateEvent(fakeEvent as never);

      // Assert
      expect(emit).toHaveBeenCalledWith("change-type", MarkdownNodeType.HEADLINE1);
    });

    it("does not emit 'change-type' when detectHeadlineTypeFromContent returns null", async () => {
      // Arrange
      vi.mocked(detectHeadlineTypeFromContent).mockReturnValue(null);

      const state = makeTextState("initial");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const { handleTipTapUpdateEvent } = useReflectiveState({ modelRef, emit });

      const fakeEvent = {
        editor: { getHTML: vi.fn(() => "<p>text</p>"), commands: { focus: vi.fn() } },
        transaction: { selection: { anchor: 5 } },
      };

      // Act
      await handleTipTapUpdateEvent(fakeEvent as never);

      // Assert
      expect(emit).not.toHaveBeenCalledWith("change-type", expect.anything());
    });
  });

  describe("expose.focus", () => {
    it("calls editor.commands.focus() when editorRef with editor is provided", () => {
      // Arrange
      const state = makeTextState("text");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const mockFocus = vi.fn();
      const editorRef = ref({ editor: { commands: { focus: mockFocus } } } as never);

      const { expose } = useReflectiveState({ modelRef, emit, editorRef });

      // Act
      expose.focus();

      // Assert
      expect(mockFocus).toHaveBeenCalled();
    });

    it("calls containingHtmlElementRef.focus() when editorRef has no editor", () => {
      // Arrange
      const state = makeTextState("text");
      const modelRef = makeModelRef(state);
      const emit = makeEmit();
      const mockFocus = vi.fn();
      const containingHtmlElementRef = ref({ focus: mockFocus } as unknown as HTMLElement);

      const { expose } = useReflectiveState({ modelRef, emit, containingHtmlElementRef });

      // Act
      expose.focus();

      // Assert
      expect(mockFocus).toHaveBeenCalled();
    });
  });
});
