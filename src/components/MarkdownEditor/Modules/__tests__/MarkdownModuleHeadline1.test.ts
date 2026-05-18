import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MarkdownModuleHeadline1 from "../MarkdownModuleHeadline1.vue";
import MarkdownModuleTextState from "../MarkdownModuleTextState";

describe("MarkdownModuleHeadline1", () => {
  function getComponent() {
    return shallowMount(MarkdownModuleHeadline1, {
      props: {
        modelValue: new MarkdownModuleTextState({ text: "" }),
      },
    });
  }

  it("renders correctly with default props", async () => {
    // Arrange
    const wrapper = getComponent();

    // Act

    // Assert
    expect(wrapper.element).toMatchSnapshot();
  });
});

