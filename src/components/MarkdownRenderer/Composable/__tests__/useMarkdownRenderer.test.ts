import { describe, expect, it } from "vitest";
import { useMarkdownRenderer } from "../useMarkdownRenderer";
import defaultRenderComponentRegistry from "../../defaultRenderComponentRegistry";
import MarkdownNodeType from "../../../MarkdownEditor/Types/MarkdownAstNodeType";

/**
 * The component registry must stay a plain (non-reactive) object. Vue components
 * must never be wrapped in reactive proxies — doing so triggers the
 * "Vue received a Component that was made a reactive object" warning for every
 * rendered block and can break dynamic `<component :is>` resolution.
 */
describe("useMarkdownRenderer", () => {
  it("exposes a render component for every default node type", () => {
    const { componentRegistry } = useMarkdownRenderer();

    for (const key of Object.keys(defaultRenderComponentRegistry)) {
      const type = Number(key) as MarkdownNodeType;
      expect(componentRegistry[type], `missing component for node type ${type}`).toBeDefined();
    }
  });

  it("never wraps component definitions in reactive proxies", () => {
    const { componentRegistry } = useMarkdownRenderer();

    for (const key of Object.keys(defaultRenderComponentRegistry)) {
      const type = Number(key) as MarkdownNodeType;
      const component = componentRegistry[type] as unknown as Record<string, unknown>;
      // A reactive proxy would carry this internal flag; a raw component must not.
      expect(component.__v_isReactive).toBeUndefined();
    }
  });

  it("overrideComponent replaces the component for a node type", () => {
    const { componentRegistry, overrideComponent } = useMarkdownRenderer();
    const original = componentRegistry[MarkdownNodeType.PARAGRAPH];
    const replacement = { name: "ReplacementRender", render: () => null } as unknown as typeof original;

    overrideComponent(MarkdownNodeType.PARAGRAPH, replacement);

    expect(componentRegistry[MarkdownNodeType.PARAGRAPH]).toBe(replacement);
  });
});
