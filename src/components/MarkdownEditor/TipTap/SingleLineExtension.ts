import { Extension } from "@tiptap/core";
import { Document } from "@tiptap/extension-document";

export const SingleLineDocument = Document.extend({
  content: "block",
});

export const HeadingDocument = Document.extend({
  content: "heading+",
});

export const PreventNewline = Extension.create({
  name: "preventNewline",
  addKeyboardShortcuts() {
    return {
      "Enter": () => true,
      "Shift-Enter": () => true,
    };
  },
});

