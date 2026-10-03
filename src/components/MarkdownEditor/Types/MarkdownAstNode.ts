import type MarkdownModuleCodeBlockState from "../Modules/MarkdownModuleCodeBlockState";
import type MarkdownModuleFileState from "../Modules/MarkdownModuleFileState";
import type MarkdownModuleImageState from "../Modules/MarkdownModuleImageState";
import type MarkdownModuleTableState from "../Modules/MarkdownModuleTableState";
import type MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import type MarkdownNodeType from "./MarkdownAstNodeType";

export class MarkdownAstNode<TState extends object = object> {
  id!: symbol;
  type!: MarkdownNodeType;
  componentState!: TState;

  editingState!: {
    cursorPosition: number;
  };

  constructor(value: Omit<MarkdownAstNode<TState>, "id">) {
    Object.assign(this, value);
    this.id = Symbol();
  }
}

export type TextNode = MarkdownAstNode<MarkdownModuleTextState>;
export type ImageNode = MarkdownAstNode<MarkdownModuleImageState>;
export type FileNode = MarkdownAstNode<MarkdownModuleFileState>;
export type CodeBlockNode = MarkdownAstNode<MarkdownModuleCodeBlockState>;
export type TableNode = MarkdownAstNode<MarkdownModuleTableState>;
