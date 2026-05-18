import type MarkdownModuleImageState from "../Modules/MarkdownModuleImageState";
import type MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import type MarkdownNodeType from "./MarkdownAstNodeType";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MarkdownAstNode<TState extends object = Record<string, any>> {
  id: symbol;
  type: MarkdownNodeType;
  componentState: TState;

  editingState: {
    cursorPosition: number;
  };

  constructor(value: Omit<MarkdownAstNode<TState>, "id">) {
    Object.assign(this, value);
    this.id = Symbol();
  }
}

export type TextNode = MarkdownAstNode<MarkdownModuleTextState>;
export type ImageNode = MarkdownAstNode<MarkdownModuleImageState>;
