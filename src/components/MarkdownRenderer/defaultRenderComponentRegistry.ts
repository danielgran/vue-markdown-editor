import type MarkdownModuleFileState from "../MarkdownEditor/Modules/MarkdownModuleFileState";
import type MarkdownModuleImageState from "../MarkdownEditor/Modules/MarkdownModuleImageState";
import type MarkdownModuleListState from "../MarkdownEditor/Modules/MarkdownModuleListState";
import type MarkdownModuleTextState from "../MarkdownEditor/Modules/MarkdownModuleTextState";
import MarkdownNodeType from "../MarkdownEditor/Types/MarkdownAstNodeType";
import MarkdownModuleFileRender from "./RenderModules/MarkdownModuleFileRender.vue";
import MarkdownModuleHeadline1Render from "./RenderModules/MarkdownModuleHeadline1Render.vue";
import MarkdownModuleHeadline2Render from "./RenderModules/MarkdownModuleHeadline2Render.vue";
import MarkdownModuleHeadline3Render from "./RenderModules/MarkdownModuleHeadline3Render.vue";
import MarkdownModuleImageRender from "./RenderModules/MarkdownModuleImageRender.vue";
import MarkdownModuleListRender from "./RenderModules/MarkdownModuleListRender.vue";
import MarkdownModuleParagraphRender from "./RenderModules/MarkdownModuleParagraphRender.vue";
import type { RenderComponent, RenderStateMap } from "./Composable/useMarkdownRenderer";

/**
 * The default render component registry, mapping each node type to its built-in render component.
 * Used as the fallback when no custom renderer instance is provided to `<MarkdownRenderer>`.
 */
const defaultRenderComponentRegistry: { [K in MarkdownNodeType]: RenderComponent<RenderStateMap[K]> } = {
  [MarkdownNodeType.PARAGRAPH]: MarkdownModuleParagraphRender as RenderComponent<MarkdownModuleTextState>,
  [MarkdownNodeType.HEADLINE1]: MarkdownModuleHeadline1Render as RenderComponent<MarkdownModuleTextState>,
  [MarkdownNodeType.HEADLINE2]: MarkdownModuleHeadline2Render as RenderComponent<MarkdownModuleTextState>,
  [MarkdownNodeType.HEADLINE3]: MarkdownModuleHeadline3Render as RenderComponent<MarkdownModuleTextState>,
  [MarkdownNodeType.LIST]: MarkdownModuleListRender as RenderComponent<MarkdownModuleListState>,
  [MarkdownNodeType.IMAGE]: MarkdownModuleImageRender as RenderComponent<MarkdownModuleImageState>,
  [MarkdownNodeType.FILE]: MarkdownModuleFileRender as RenderComponent<MarkdownModuleFileState>,
};

export default defaultRenderComponentRegistry;
