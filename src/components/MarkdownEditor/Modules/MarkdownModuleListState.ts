import type MarkdownModuleTextState from "./MarkdownModuleTextState";

export default class MarkdownModuleListState {
  items: MarkdownModuleTextState[];

  constructor(object: MarkdownModuleListState) {
    Object.assign(this, object);
  }
}

