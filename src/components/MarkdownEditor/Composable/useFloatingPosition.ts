import {
  autoUpdate, computePosition, flip, offset, shift, type ReferenceElement,
} from "@floating-ui/dom";
import {
  computed, onBeforeUnmount, watch, type Ref,
} from "vue";

/** Gap between a menu and the point it opens above. */
const GAP_ABOVE = 8;

/** Distance a menu keeps from the edges of the viewport. */
const VIEWPORT_PADDING = 8;

/** Which side of its point a menu opens on. */
export type FloatingPlacement = "above" | "below";

export interface FloatingPositionOptions {
  /** Client point the menu is placed at. */
  x: Ref<number>;
  y: Ref<number>;
  /**
   * Element the point belongs to. It is measured again on every computation, which
   * is what keeps a menu attached to its block while the page scrolls. Without an
   * anchor the point stays where the menu was opened.
   */
  anchor?: Ref<HTMLElement | null | undefined>;
  /** The element to place. */
  floatingRef: Ref<HTMLElement | null>;
  /** Defaults to `"below"`. */
  placement?: Ref<FloatingPlacement | undefined>;
}

/** A zero-size reference, the shape floating UI aligns points with. */
function pointReference(anchor: HTMLElement | null, x: number, y: number): ReferenceElement {
  if (!anchor) {
    return { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
  }

  // Capture the point relative to the anchor and resolve it against the anchor
  // again on every measurement, so the point travels with the anchor.
  const baseRect = anchor.getBoundingClientRect();
  const offsetX = x - baseRect.left;
  const offsetY = y - baseRect.top;

  return {
    contextElement: anchor,
    getBoundingClientRect: () => {
      const rect = anchor.getBoundingClientRect();

      return new DOMRect(rect.left + offsetX, rect.top + offsetY, 0, 0);
    },
  };
}

/**
 * Places a floating element at `x`/`y` — below the point by default, above and
 * centered on it with `"above"` — and moves it along while the page scrolls or
 * resizes. The position is written straight onto the element: a menu is repositioned
 * on every scroll frame, which is not worth a re-render.
 */
export default function useFloatingPosition(options: FloatingPositionOptions) {
  const reference = computed(() => pointReference(
    options.anchor?.value ?? null,
    options.x.value,
    options.y.value,
  ));

  function place() {
    const floating = options.floatingRef.value;
    if (!floating) return;

    const above = options.placement?.value === "above";

    computePosition(reference.value, floating, {
      strategy: "fixed",
      // The reference is a point without size, so "bottom-start" puts the element's
      // top left corner on it, while "top" centers the element over it.
      placement: above ? "top" : "bottom-start",
      middleware: [
        offset(above ? GAP_ABOVE : 0),
        // A menu at the edge of the viewport mirrors to the other side of its point
        // and is nudged sideways instead of being cut off.
        flip({ padding: VIEWPORT_PADDING }),
        shift({ padding: VIEWPORT_PADDING }),
      ],
    }).then(({ x, y }) => {
      floating.style.left = `${x}px`;
      floating.style.top = `${y}px`;
    });
  }

  let stopAutoUpdate: (() => void) | null = null;

  // Menus appear and disappear with `v-if`, so (re)attach whenever the element to
  // place, the point or the side changes; autoUpdate keeps them placed afterwards.
  watch(
    [options.floatingRef, reference, options.placement],
    () => {
      stopAutoUpdate?.();
      stopAutoUpdate = null;

      const floating = options.floatingRef.value;
      if (!floating) return;

      stopAutoUpdate = autoUpdate(reference.value, floating, place);
    },
    { flush: "post" },
  );

  onBeforeUnmount(() => {
    stopAutoUpdate?.();
    stopAutoUpdate = null;
  });
}
