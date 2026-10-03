<template>
  <div
    ref="divRef"
    class="markdown-module-table"
    tabindex="0"
  >
    <table>
      <thead>
        <tr>
          <th
            v-for="(header, index) in localState.headers"
            :key="`h-${index}`"
          >
            <input
              :value="header"
              @input="updateHeader(index, ($event.target as HTMLInputElement).value)"
            >
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in localState.rows"
          :key="`r-${rowIndex}`"
        >
          <td
            v-for="(cell, cellIndex) in row"
            :key="`c-${rowIndex}-${cellIndex}`"
          >
            <input
              :value="cell"
              @input="updateCell(rowIndex, cellIndex, ($event.target as HTMLInputElement).value)"
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type MarkdownModuleTableState from "./MarkdownModuleTableState";

const modelValue = defineModel<MarkdownModuleTableState>({ required: true });

const divRef = ref<HTMLDivElement>();

const localState = ref<MarkdownModuleTableState>({
  headers: [...(modelValue.value.headers ?? [])],
  rows: (modelValue.value.rows ?? []).map(row => [...row]),
});

function updateHeader(index: number, value: string) {
  localState.value.headers[index] = value;
  writeThrough();
}

function updateCell(rowIndex: number, cellIndex: number, value: string) {
  localState.value.rows[rowIndex][cellIndex] = value;
  writeThrough();
}

function writeThrough() {
  modelValue.value.headers = [...localState.value.headers];
  modelValue.value.rows = localState.value.rows.map(row => [...row]);
}

function focus() {
  divRef.value?.focus();
}

defineExpose({ focus });
</script>

<style lang="scss" scoped>
.markdown-module-table {
  outline: none;
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #d1d5db;
    padding: 0.25rem;
  }

  input {
    width: 100%;
    border: none;
    background: transparent;
    padding: 0.25rem 0.5rem;
    box-sizing: border-box;

    &:focus {
      outline: 1px solid #3b82f6;
    }
  }
}
</style>
