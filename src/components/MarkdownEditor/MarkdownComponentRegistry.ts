import type { Component } from "vue";
import MarkdownModuleHeadline1 from "./Modules/MarkdownModuleHeadline1.vue";
import MarkdownModuleHeadline2 from "./Modules/MarkdownModuleHeadline2.vue";
import MarkdownModuleHeadline3 from "./Modules/MarkdownModuleHeadline3.vue";
import MarkdownModuleImage from "./Modules/MarkdownModuleImage.vue";
import MarkdownModuleImageState from "./Modules/MarkdownModuleImageState";
import MarkdownModuleParagraph from "./Modules/MarkdownModuleParagraph.vue";
import MarkdownModuleTextState from "./Modules/MarkdownModuleTextState";
import type { MarkdownAstNode } from "./Types/MarkdownAstNode";
import MarkdownNodeType from "./Types/MarkdownAstNodeType";

type MarkdownComponentRegistryEntry = {
  component: Component;
  stateType: new (
    object: MarkdownModuleTextState | MarkdownModuleImageState,
  ) => MarkdownModuleTextState | MarkdownModuleImageState;
};

const registry: Record<MarkdownNodeType, MarkdownComponentRegistryEntry> = {
  [MarkdownNodeType.PARAGRAPH]: {
    component: MarkdownModuleParagraph,
    stateType: MarkdownModuleTextState,
  },
  [MarkdownNodeType.HEADLINE1]: {
    component: MarkdownModuleHeadline1,
    stateType: MarkdownModuleTextState,
  },
  [MarkdownNodeType.HEADLINE2]: {
    component: MarkdownModuleHeadline2,
    stateType: MarkdownModuleTextState,
  },
  [MarkdownNodeType.HEADLINE3]: {
    component: MarkdownModuleHeadline3,
    stateType: MarkdownModuleTextState,
  },
  [MarkdownNodeType.IMAGE]: {
    component: MarkdownModuleImage,
    stateType: MarkdownModuleImageState,
  },
};

export function isTextNodeState(
  state: MarkdownAstNode,
): state is MarkdownAstNode & { componentState: MarkdownModuleTextState } {
  return state.componentState instanceof MarkdownModuleTextState;
}

export default registry;
