export default class MarkdownModuleFileState {
  url!: string;
  fileName!: string;
  fileSize!: number;
  mimeType!: string;
  uploadError!: string;

  constructor(object: MarkdownModuleFileState) {
    Object.assign(this, object);
  }
}
