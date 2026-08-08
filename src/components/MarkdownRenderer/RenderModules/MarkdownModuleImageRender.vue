<template>
  <figure>
    <img
      :src="state.src"
      :alt="state.alt"
      loading="lazy"
    >
    <figcaption v-if="state.caption">{{ state.caption }}</figcaption>
  </figure>
</template>

<script lang="ts" setup>
import type MarkdownModuleImageState from "../../MarkdownEditor/Modules/MarkdownModuleImageState";

defineProps<{ state: MarkdownModuleImageState }>();
</script>
