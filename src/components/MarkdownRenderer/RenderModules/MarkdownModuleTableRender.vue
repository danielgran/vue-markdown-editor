<template>
  <div class="markdown-renderer-table-wrapper">
    <table>
      <thead v-if="state.headers.length > 0">
        <tr>
          <th
            v-for="(header, index) in state.headers"
            :key="`h-${index}`"
            v-html="cellHtml(header)"
          />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in state.rows"
          :key="`r-${rowIndex}`"
        >
          <td
            v-for="(cell, cellIndex) in row"
            :key="`c-${rowIndex}-${cellIndex}`"
            v-html="cellHtml(cell)"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { marked } from "marked";
import type MarkdownModuleTableState from "../../MarkdownEditor/Modules/MarkdownModuleTableState";

defineProps<{ state: MarkdownModuleTableState }>();

function cellHtml(cell: string): string {
  return marked.parseInline(cell) as string;
}
</script>
