import registry from "../MarkdownComponentRegistry";
import type MarkdownModuleImageState from "../Modules/MarkdownModuleImageState";
import type MarkdownModuleListState from "../Modules/MarkdownModuleListState";
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

  createBlankParagraph(): MarkdownAstNode<MarkdownModuleTextState> {
    return this.createTextNode(MarkdownNodeType.PARAGRAPH, "");
  }
}

export default new MarkdownNodeFactory();
