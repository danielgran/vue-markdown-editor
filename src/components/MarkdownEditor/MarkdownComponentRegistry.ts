import type { Component } from "vue";
import MarkdownModuleBlockquote from "./Modules/MarkdownModuleBlockquote.vue";
import MarkdownModuleCodeBlock from "./Modules/MarkdownModuleCodeBlock.vue";
import MarkdownModuleCodeBlockState from "./Modules/MarkdownModuleCodeBlockState";
import MarkdownModuleFile from "./Modules/MarkdownModuleFile.vue";
import MarkdownModuleFileState from "./Modules/MarkdownModuleFileState";
import MarkdownModuleHeadline1 from "./Modules/MarkdownModuleHeadline1.vue";
import MarkdownModuleHeadline2 from "./Modules/MarkdownModuleHeadline2.vue";
import MarkdownModuleHeadline3 from "./Modules/MarkdownModuleHeadline3.vue";
import MarkdownModuleHr from "./Modules/MarkdownModuleHr.vue";
import MarkdownModuleHrState from "./Modules/MarkdownModuleHrState";
import MarkdownModuleImage from "./Modules/MarkdownModuleImage.vue";
import MarkdownModuleImageState from "./Modules/MarkdownModuleImageState";
import MarkdownModuleList from "./Modules/MarkdownModuleList.vue";
import MarkdownModuleListState from "./Modules/MarkdownModuleListState";
import MarkdownModuleOrderedList from "./Modules/MarkdownModuleOrderedList.vue";
import MarkdownModuleParagraph from "./Modules/MarkdownModuleParagraph.vue";
import MarkdownModuleTable from "./Modules/MarkdownModuleTable.vue";
import MarkdownModuleTableState from "./Modules/MarkdownModuleTableState";
import MarkdownModuleTextState from "./Modules/MarkdownModuleTextState";
import type { MarkdownAstNode } from "./Types/MarkdownAstNode";
import MarkdownNodeType from "./Types/MarkdownAstNodeType";

type StateTypeConstructor
  = typeof MarkdownModuleTextState
  | typeof MarkdownModuleImageState
  | typeof MarkdownModuleListState
  | typeof MarkdownModuleFileState
  | typeof MarkdownModuleCodeBlockState
  | typeof MarkdownModuleHrState
  | typeof MarkdownModuleTableState;

type MarkdownComponentRegistryEntry = {
  component: Component;
  stateType: StateTypeConstructor;
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
  [MarkdownNodeType.LIST]: {
    component: MarkdownModuleList,
    stateType: MarkdownModuleListState,
  },
  [MarkdownNodeType.ORDERED_LIST]: {
    component: MarkdownModuleOrderedList,
    stateType: MarkdownModuleListState,
  },
  [MarkdownNodeType.BLOCKQUOTE]: {
    component: MarkdownModuleBlockquote,
    stateType: MarkdownModuleTextState,
  },
  [MarkdownNodeType.CODE_BLOCK]: {
    component: MarkdownModuleCodeBlock,
    stateType: MarkdownModuleCodeBlockState,
  },
  [MarkdownNodeType.HR]: {
    component: MarkdownModuleHr,
    stateType: MarkdownModuleHrState,
  },
  [MarkdownNodeType.TABLE]: {
    component: MarkdownModuleTable,
    stateType: MarkdownModuleTableState,
  },
  [MarkdownNodeType.IMAGE]: {
    component: MarkdownModuleImage,
    stateType: MarkdownModuleImageState,
  },
  [MarkdownNodeType.FILE]: {
    component: MarkdownModuleFile,
    stateType: MarkdownModuleFileState,
  },
};

export function isTextNodeState(
  state: MarkdownAstNode,
): state is MarkdownAstNode & { componentState: MarkdownModuleTextState } {
  return state.componentState instanceof MarkdownModuleTextState;
}

export default registry;
