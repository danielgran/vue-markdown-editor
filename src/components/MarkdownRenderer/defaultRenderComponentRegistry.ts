import type MarkdownModuleCodeBlockState from "../MarkdownEditor/Modules/MarkdownModuleCodeBlockState";
import type MarkdownModuleFileState from "../MarkdownEditor/Modules/MarkdownModuleFileState";
import type MarkdownModuleImageState from "../MarkdownEditor/Modules/MarkdownModuleImageState";
import type MarkdownModuleListState from "../MarkdownEditor/Modules/MarkdownModuleListState";
import type MarkdownModuleTableState from "../MarkdownEditor/Modules/MarkdownModuleTableState";
import type MarkdownModuleTextState from "../MarkdownEditor/Modules/MarkdownModuleTextState";
import MarkdownNodeType from "../MarkdownEditor/Types/MarkdownAstNodeType";
import MarkdownModuleBlockquoteRender from "./RenderModules/MarkdownModuleBlockquoteRender.vue";
import MarkdownModuleCodeBlockRender from "./RenderModules/MarkdownModuleCodeBlockRender.vue";
import MarkdownModuleFileRender from "./RenderModules/MarkdownModuleFileRender.vue";
import MarkdownModuleHeadline1Render from "./RenderModules/MarkdownModuleHeadline1Render.vue";
import MarkdownModuleHeadline2Render from "./RenderModules/MarkdownModuleHeadline2Render.vue";
import MarkdownModuleHeadline3Render from "./RenderModules/MarkdownModuleHeadline3Render.vue";
import MarkdownModuleHrRender from "./RenderModules/MarkdownModuleHrRender.vue";
import MarkdownModuleImageRender from "./RenderModules/MarkdownModuleImageRender.vue";
import MarkdownModuleListRender from "./RenderModules/MarkdownModuleListRender.vue";
import MarkdownModuleOrderedListRender from "./RenderModules/MarkdownModuleOrderedListRender.vue";
import MarkdownModuleParagraphRender from "./RenderModules/MarkdownModuleParagraphRender.vue";
import MarkdownModuleTableRender from "./RenderModules/MarkdownModuleTableRender.vue";
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
  [MarkdownNodeType.ORDERED_LIST]: MarkdownModuleOrderedListRender as RenderComponent<MarkdownModuleListState>,
  [MarkdownNodeType.BLOCKQUOTE]: MarkdownModuleBlockquoteRender as RenderComponent<MarkdownModuleTextState>,
  [MarkdownNodeType.CODE_BLOCK]: MarkdownModuleCodeBlockRender as RenderComponent<MarkdownModuleCodeBlockState>,
  [MarkdownNodeType.HR]: MarkdownModuleHrRender as RenderComponent<Record<string, never>>,
  [MarkdownNodeType.TABLE]: MarkdownModuleTableRender as RenderComponent<MarkdownModuleTableState>,
  [MarkdownNodeType.IMAGE]: MarkdownModuleImageRender as RenderComponent<MarkdownModuleImageState>,
  [MarkdownNodeType.FILE]: MarkdownModuleFileRender as RenderComponent<MarkdownModuleFileState>,
};

export default defaultRenderComponentRegistry;
