import registry from "../MarkdownComponentRegistry";
import type MarkdownModuleCodeBlockState from "../Modules/MarkdownModuleCodeBlockState";
import type MarkdownModuleFileState from "../Modules/MarkdownModuleFileState";
import type MarkdownModuleImageState from "../Modules/MarkdownModuleImageState";
import type MarkdownModuleListState from "../Modules/MarkdownModuleListState";
import type MarkdownModuleTableState from "../Modules/MarkdownModuleTableState";
import MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { type TextishNodeType } from "../Types/MarkdownAstNodeType";

class MarkdownNodeFactory {
  private createNode<TState extends object>(
    type: MarkdownNodeType,
    stateData: Partial<TState>,
  ): MarkdownAstNode<TState> {
    const StateConstructor = registry[type].stateType as unknown as new (object: Partial<TState>) => TState;

    const componentState = new StateConstructor(stateData as TState);

    return new MarkdownAstNode<TState>({
      type,
      componentState,
      editingState: {
        cursorPosition: 0,
      },
    });
  }

  createTextNode(type: TextishNodeType, text: string): MarkdownAstNode<MarkdownModuleTextState> {
    return this.createNode<MarkdownModuleTextState>(type, { text });
  }

  createImageNode(src: string, alt: string, caption: string = ""): MarkdownAstNode<MarkdownModuleImageState> {
    return this.createNode<MarkdownModuleImageState>(MarkdownNodeType.IMAGE, {
      src,
      alt,
      caption,
    } as MarkdownModuleImageState);
  }

  createListNode(items: string[]): MarkdownAstNode<MarkdownModuleListState> {
    return this.createNode<MarkdownModuleListState>(MarkdownNodeType.LIST, {
      items: items.map(text => new MarkdownModuleTextState({ text })),
    } as MarkdownModuleListState);
  }

  createOrderedListNode(items: string[]): MarkdownAstNode<MarkdownModuleListState> {
    return this.createNode<MarkdownModuleListState>(MarkdownNodeType.ORDERED_LIST, {
      items: items.map(text => new MarkdownModuleTextState({ text })),
    } as MarkdownModuleListState);
  }

  createBlockquoteNode(text: string): MarkdownAstNode<MarkdownModuleTextState> {
    return this.createTextNode(MarkdownNodeType.BLOCKQUOTE, text);
  }

  createCodeBlockNode(code: string, language: string = ""): MarkdownAstNode<MarkdownModuleCodeBlockState> {
    return this.createNode<MarkdownModuleCodeBlockState>(MarkdownNodeType.CODE_BLOCK, {
      code,
      language,
    });
  }

  createHrNode(): MarkdownAstNode {
    return this.createNode<Record<string, never>>(MarkdownNodeType.HR, {});
  }

  createTableNode(headers: string[], rows: string[][]): MarkdownAstNode<MarkdownModuleTableState> {
    return this.createNode<MarkdownModuleTableState>(MarkdownNodeType.TABLE, {
      headers,
      rows,
    });
  }

  createBlankParagraph(): MarkdownAstNode<MarkdownModuleTextState> {
    return this.createTextNode(MarkdownNodeType.PARAGRAPH, "");
  }

  createFileNode(
    url: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    uploadError: string = "",
  ): MarkdownAstNode<MarkdownModuleFileState> {
    return this.createNode<MarkdownModuleFileState>(MarkdownNodeType.FILE, {
      url,
      fileName,
      fileSize,
      mimeType,
      uploadError,
    });
  }
}

export default new MarkdownNodeFactory();
