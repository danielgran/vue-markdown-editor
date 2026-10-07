import { Document } from "@tiptap/extension-document";

export const SingleLineDocument = Document.extend({
  content: "block",
});

export const HeadingDocument = Document.extend({
  content: "heading+",
});
