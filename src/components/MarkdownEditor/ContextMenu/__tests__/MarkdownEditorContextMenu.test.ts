import { flushPromises, shallowMount } from "@vue/test-utils";
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from "vitest";
import { nextTick } from "vue";
import MarkdownEditorContextMenu from "../MarkdownEditorContextMenu.vue";

/** The menu is positioned asynchronously, so let the layout pass settle first. */
async function settle() {
  await flushPromises();
  await nextTick();
}

/** The positioned element inside the teleported (stubbed) menu. */
function menuElement(wrapper: ReturnType<typeof shallowMount>): HTMLElement {
  const menu = wrapper.find(".markdown-editor-context-menu").element;

  return menu as HTMLElement;
}

/** Gives `element` a fixed rect, standing in for the browser's layout. */
function stubRect(element: HTMLElement, rect: Partial<DOMRect>) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
}

/**
 * happy-dom lays nothing out, so the viewport it clips against has no size. Give it
 * the real one, otherwise every position is clamped into an empty viewport.
 */
function stubViewport() {
  vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(window.innerWidth);
  vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(window.innerHeight);
}

/** Gives the menus a size, which happy-dom does not report. */
function stubMenuSize({ width, height }: { width: number; height: number }) {
  const sizeOf = (element: HTMLElement, value: number) => (
    element.classList.contains("markdown-editor-context-menu") ? value : 0
  );

  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get")
    .mockImplementation(function (this: HTMLElement) { return sizeOf(this, width); });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get")
    .mockImplementation(function (this: HTMLElement) { return sizeOf(this, height); });
}

beforeEach(() => {
  stubViewport();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MarkdownEditorContextMenu", () => {
  describe("placement: below (default)", () => {
    it("renders with left/top inline styles when no placement is given", async () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x: 100, y: 200 },
        global: { stubs: { Teleport: true } },
      });
      await settle();

      // Assert
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("placement: above", () => {
    it("renders centered above the anchor when placement is 'above'", async () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x: 300, y: 150, placement: "above" },
        global: { stubs: { Teleport: true } },
      });
      await settle();

      // Assert
      // The menu has no measured size here, so only the 8px gap shifts it up.
      expect(menuElement(wrapper).style.left).toBe("300px");
      expect(menuElement(wrapper).style.top).toBe("142px");
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe("anchor", () => {
    it("keeps the menu at the anchor while the page scrolls", async () => {
      // Arrange
      const anchor = document.createElement("div");
      document.body.appendChild(anchor);
      stubRect(anchor, { top: 100, left: 40, bottom: 120, height: 20, width: 200 });

      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x: 50, y: 125, anchor },
        global: { stubs: { Teleport: true } },
      });
      await settle();
      expect(menuElement(wrapper).style.top).toBe("125px");

      // Act — the anchor moves up by 60px, as it does when scrolling down.
      stubRect(anchor, { top: 40, left: 40, bottom: 60, height: 20, width: 200 });
      window.dispatchEvent(new Event("scroll"));
      await settle();

      // Assert — the menu follows the block it belongs to.
      expect(menuElement(wrapper).style.left).toBe("50px");
      expect(menuElement(wrapper).style.top).toBe("65px");

      // Cleanup
      wrapper.unmount();
      anchor.remove();
    });
  });

  describe("viewport edges", () => {
    const menuSize = { width: 120, height: 100 };

    it("flips the menu above the point when there is no room below", async () => {
      // Arrange
      stubMenuSize(menuSize);
      const y = window.innerHeight - 20;

      // Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x: 100, y },
        global: { stubs: { Teleport: true } },
      });
      await settle();

      // Assert
      expect(menuElement(wrapper).style.top).toBe(`${y - menuSize.height}px`);
      expect(menuElement(wrapper).style.left).toBe("100px");
    });

    it("shifts the menu back inside the viewport edge", async () => {
      // Arrange
      stubMenuSize(menuSize);
      const x = window.innerWidth - 4;

      // Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        props: { x, y: 100 },
        global: { stubs: { Teleport: true } },
      });
      await settle();

      // Assert
      expect(menuElement(wrapper).style.left).toBe(`${window.innerWidth - 8 - menuSize.width}px`);
      expect(menuElement(wrapper).style.top).toBe("100px");
    });
  });

  describe("slot content", () => {
    it("renders default slot content", async () => {
      // Arrange / Act
      const wrapper = shallowMount(MarkdownEditorContextMenu, {
        // Point (0, 0) sits on the viewport edge, which the menu is padded away from.
        props: { x: 0, y: 0 },
        slots: { default: "<span>Menu Item</span>" },
        global: { stubs: { Teleport: true } },
      });
      await settle();

      // Assert
      expect(menuElement(wrapper).querySelector("span")?.textContent).toBe("Menu Item");
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
