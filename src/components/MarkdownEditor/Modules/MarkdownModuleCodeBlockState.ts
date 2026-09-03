export default class MarkdownModuleCodeBlockState {
  code!: string;
  language!: string;

  constructor(object: MarkdownModuleCodeBlockState) {
    Object.assign(this, object);
  }
}
