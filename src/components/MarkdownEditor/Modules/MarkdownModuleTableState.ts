export default class MarkdownModuleTableState {
  headers!: string[];
  rows!: string[][];

  constructor(object: MarkdownModuleTableState) {
    Object.assign(this, object);
  }
}
