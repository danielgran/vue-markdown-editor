import { shallowMount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType from "../Types/MarkdownAstNodeType";
import MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";

// --- Mock VueUse (second-layer deps) ---
vi.mock("@vueuse/core", () => ({
  useFocusWithin: vi.fn(() => ({ focused: ref(false) })),
  useMouseInElement: vi.fn(() => ({ isOutside: ref(true) })),
}));

import MarkdownEditorModule from "../MarkdownEditorModule.vue";

// Stub that exposes focus() so onMounted doesn't throw
const FocusableComponentStub = defineComponent({
  template: "<div data-stub=\"module-component\" />",
  setup(_, { expose }) {
    expose({ focus: vi.fn() });
    return {};
  },
});

function makeParagraphNode(): MarkdownAstNode {
  return new MarkdownAstNode({
    type: MarkdownNodeType.PARAGRAPH,
    componentState: new MarkdownModuleTextState({ text: "Hello world" }),
    editingState: { cursorPosition: 0 },
  });
}

describe("MarkdownEditorModule", () => {
  describe("unfocused state", () => {
    it("renders without focus controls when not focused and not hovered", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorModule, {
        props: { node: makeParagraphNode(), focused: false },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("focused state", () => {
    it("renders with focus controls slot visible when focused", () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorModule, {
        props: { node: makeParagraphNode(), focused: true },
        slots: { "focus-controls": "<button>Delete</button>" },
        global: { stubs: { MarkdownModuleParagraph: FocusableComponentStub } },
      });

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
