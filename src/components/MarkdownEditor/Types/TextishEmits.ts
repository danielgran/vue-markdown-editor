import type MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import type MarkdownAstNodeType from "./MarkdownAstNodeType";

export interface TextishEmits {
  "update:model-value": [componentState: MarkdownModuleTextState];
  "update:cursor-position": [cursorPosition: number];
  "change-type": [newType: MarkdownAstNodeType];
}

export interface TextishEmitFunction {
  (event: "update:model-value", value: MarkdownModuleTextState): void;
  (event: "update:cursor-position", value: number): void;
  (event: "change-type", value: MarkdownAstNodeType): void;
}
