import type { Component } from "vue";
import MarkdownNodeType from "../MarkdownEditor/Types/MarkdownAstNodeType";
import MarkdownModuleHeadline1Render from "./RenderModules/MarkdownModuleHeadline1Render.vue";
import MarkdownModuleHeadline2Render from "./RenderModules/MarkdownModuleHeadline2Render.vue";
import MarkdownModuleHeadline3Render from "./RenderModules/MarkdownModuleHeadline3Render.vue";
import MarkdownModuleImageRender from "./RenderModules/MarkdownModuleImageRender.vue";
import MarkdownModuleListRender from "./RenderModules/MarkdownModuleListRender.vue";
import MarkdownModuleParagraphRender from "./RenderModules/MarkdownModuleParagraphRender.vue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RenderComponent = Component<{ state: any }>;

const RenderComponentRegistry: Record<MarkdownNodeType, RenderComponent> = {
  [MarkdownNodeType.PARAGRAPH]: MarkdownModuleParagraphRender,
  [MarkdownNodeType.HEADLINE1]: MarkdownModuleHeadline1Render,
  [MarkdownNodeType.HEADLINE2]: MarkdownModuleHeadline2Render,
  [MarkdownNodeType.HEADLINE3]: MarkdownModuleHeadline3Render,
  [MarkdownNodeType.LIST]: MarkdownModuleListRender,
  [MarkdownNodeType.IMAGE]: MarkdownModuleImageRender,
};

export default RenderComponentRegistry;
