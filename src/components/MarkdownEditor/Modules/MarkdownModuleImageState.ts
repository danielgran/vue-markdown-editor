export default class MarkdownModuleImageState {
  src: string;
  alt: string;
  caption: string;

  constructor(object: MarkdownModuleImageState) {
    Object.assign(this, object);
  }
}

