import { type Component, reactive } from "vue";
import type MarkdownModuleCodeBlockState from "../../MarkdownEditor/Modules/MarkdownModuleCodeBlockState";
import type MarkdownModuleFileState from "../../MarkdownEditor/Modules/MarkdownModuleFileState";
import type MarkdownModuleImageState from "../../MarkdownEditor/Modules/MarkdownModuleImageState";
import type MarkdownModuleListState from "../../MarkdownEditor/Modules/MarkdownModuleListState";
import type MarkdownModuleTableState from "../../MarkdownEditor/Modules/MarkdownModuleTableState";
import type MarkdownModuleTextState from "../../MarkdownEditor/Modules/MarkdownModuleTextState";
import MarkdownNodeType from "../../MarkdownEditor/Types/MarkdownAstNodeType";
import defaultRenderComponentRegistry from "../defaultRenderComponentRegistry";

/**
 * Maps each MarkdownNodeType to its corresponding component state class.
 * Used to strictly type the component registry and overrideComponent().
 */
export interface RenderStateMap {
  [MarkdownNodeType.PARAGRAPH]: MarkdownModuleTextState;
  [MarkdownNodeType.HEADLINE1]: MarkdownModuleTextState;
  [MarkdownNodeType.HEADLINE2]: MarkdownModuleTextState;
  [MarkdownNodeType.HEADLINE3]: MarkdownModuleTextState;
  [MarkdownNodeType.LIST]: MarkdownModuleListState;
  [MarkdownNodeType.ORDERED_LIST]: MarkdownModuleListState;
  [MarkdownNodeType.BLOCKQUOTE]: MarkdownModuleTextState;
  [MarkdownNodeType.CODE_BLOCK]: MarkdownModuleCodeBlockState;
  [MarkdownNodeType.HR]: Record<string, never>;
  [MarkdownNodeType.TABLE]: MarkdownModuleTableState;
  [MarkdownNodeType.IMAGE]: MarkdownModuleImageState;
  [MarkdownNodeType.FILE]: MarkdownModuleFileState;
}

/**
 * A Vue component that accepts a `state` prop typed to the given state class.
 */
export type RenderComponent<TState extends object = object> = Component<{ state: TState }>;

/**
 * Creates a reactive Markdown renderer instance that can be bound to `<MarkdownRenderer>`.
 *
 * The returned instance allows overriding the default render components on a per-node-type
 * basis via `overrideComponent()`. Each override is strictly typed — the replacement
 * component must accept the correct `state` prop for that node type.
 *
 * @example
 * ```ts
 * import { useMarkdownRenderer, type MarkdownRendererInstance } from "@grandaniel/vue-markdown-editor";
 * import CustomImageRender from "./CustomImageRender.vue";
 * import MarkdownNodeType from "@grandaniel/vue-markdown-editor";
 *
 * const renderer = useMarkdownRenderer();
 * renderer.overrideComponent(MarkdownNodeType.IMAGE, CustomImageRender);
 * ```
 */
export function useMarkdownRenderer() {
  const componentRegistry = reactive<{ [K in MarkdownNodeType]: RenderComponent<RenderStateMap[K]> }>({
    ...defaultRenderComponentRegistry,
  });

  /**
   * Override the render component for a specific node type.
   *
   * The replacement component must accept a `state` prop matching the state type
   * associated with the given node type (e.g. `MarkdownModuleImageState` for `IMAGE`).
   *
   * @param type - The node type to override.
   * @param component - The replacement Vue component.
   */
  function overrideComponent<K extends MarkdownNodeType>(
    type: K,
    component: RenderComponent<RenderStateMap[K]>,
  ): void {
    // TypeScript can't prove assignability when indexing a mapped type with a generic K.
    // This is safe because the function signature already enforces the correct state type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (componentRegistry as any)[type] = component;
  }

  return {
    componentRegistry,
    overrideComponent,
  };
}

export type MarkdownRendererInstance = ReturnType<typeof useMarkdownRenderer>;
