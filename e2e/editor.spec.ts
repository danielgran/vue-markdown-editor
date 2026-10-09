import { expect, test } from "@playwright/test";

const editorModules = ".markdown-editor-module";
const editorContent = ".markdown-editor-module-content";

test.describe("Notion-like Markdown editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the showcase content and keeps the raw Markdown output visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "vue-markdown-editor", exact: true })).toBeVisible();
    await expect(page.locator(".dev-output pre")).toContainText("# Welcome to vue-markdown-editor");
    await expect(page.locator(editorModules)).not.toHaveCount(0);
    await expect(page.locator(`${editorContent} [contenteditable="true"]`).first()).toBeVisible();
  });

  test("opens and filters the slash menu, then converts a block", async ({ page }) => {
    const lastModule = page.locator(editorModules).last();

    await lastModule.hover();
    await lastModule.getByTitle("Add block below").click();

    const newBlock = page.locator(editorModules).last();
    const editor = newBlock.locator("[contenteditable=\"true\"]");
    await editor.fill("/heading 2");

    const slashMenu = page.locator(".markdown-editor-slash-menu");
    await expect(slashMenu).toBeVisible();
    await expect(slashMenu.getByRole("button")).toHaveCount(1);
    await expect(slashMenu.getByRole("button", { name: /Heading 2/ })).toBeVisible();

    await slashMenu.getByRole("button", { name: /Heading 2/ }).click();
    await expect(newBlock.locator("h2")).toBeVisible();

    await newBlock.locator("[contenteditable=\"true\"]").fill("Product roadmap");
    await expect(page.locator(".dev-output pre")).toContainText("## Product roadmap");
    await expect(page.locator(".dev-output pre")).not.toContainText("/heading 2");
  });

  test("splits a block with Enter and serializes both blocks", async ({ page }) => {
    const initialModuleCount = await page.locator(editorModules).count();
    const paragraph = page.locator(editorModules).filter({
      hasText: "A block-based, node-editable Markdown editor",
    }).first();
    const editor = paragraph.locator("[contenteditable=\"true\"]");

    await editor.click();
    await editor.press("End");
    await editor.press("Enter");
    await editor.type("This paragraph was created with Enter.");

    await expect(page.locator(".dev-output pre")).toContainText(
      "A block-based, node-editable Markdown editor built for Vue 3 with TipTap.",
    );
    await expect(page.locator(".dev-output pre")).toContainText(
      "This paragraph was created with Enter.",
    );
    await expect(page.locator(editorModules)).toHaveCount(initialModuleCount + 1);
  });

  test("supports keyboard navigation in the slash menu", async ({ page }) => {
    const lastModule = page.locator(editorModules).last();

    await lastModule.hover();
    await lastModule.getByTitle("Add block below").click();
    const editor = page.locator(editorModules).last().locator("[contenteditable=\"true\"]");
    await editor.fill("/");

    const slashMenu = page.locator(".markdown-editor-slash-menu");
    await expect(slashMenu).toBeVisible();
    const firstCommand = slashMenu.getByRole("button").first();
    await expect(firstCommand).toHaveClass(/is-active/);

    await editor.press("ArrowDown");
    await expect(slashMenu.getByRole("button").nth(1)).toHaveClass(/is-active/);
    await editor.press("Enter");

    await expect(page.locator(editorModules).last().locator("h1")).toBeVisible();
    await expect(slashMenu).toBeHidden();
  });
});
