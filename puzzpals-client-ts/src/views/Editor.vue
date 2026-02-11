<template>
  <div>
    <button
      v-for="tool in tools"
      :key="tool"
      :class="{ active: currentTool === tool }"
      @click="currentTool = tool"
    >
      {{ tool }}
    </button>
  </div>
  <div>
    Current dimensions: Row: {{ rowCount }}, Col: {{ colCount }}

    <br />

    Set dimensions: Row:
    <input type="number" v-model.number="inputRowCount" min="1" max="100" />
    Col:
    <input type="number" v-model.number="inputColCount" min="1" max="100" />

    <button @click="setDimensions">Set</button>
  </div>
  Current tool: {{ currentTool }}
  <button @click="exportGrid" :disabled="!canExport">Export as akari</button>
  <div class="grid-wrapper">
    <div>
      <div v-for="(row, rowIdx) in grid" :key="rowIdx" class="grid-row">
        <div
          v-for="(cell, colIdx) in row"
          class="cell"
          :class="`cell-color-${cell.color}`"
          @click="onClickCell(cell)"
          :key="colIdx"
        >
          {{ cell.symbol.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type CellData = {
  symbol: {
    text: CellText;
  };
  color: string;
};

type CellText = "" | "0" | "1" | "2" | "3" | "4";

const rowCount = ref(6);
const colCount = ref(7);
const inputRowCount = ref("6");
const inputColCount = ref("7");

const tools = ["colors", "symbols"];
const currentTool = ref(tools[0]);

const grid = ref<CellData[][]>([]);

const createEmptyCell = () => {
  return {
    symbol: {
      text: "" as CellText,
    },
    color: "white",
  };
};

for (let i = 0; i < rowCount.value; i++) {
  const row: CellData[] = [];
  for (let j = 0; j < colCount.value; j++) {
    row.push(createEmptyCell());
  }
  grid.value.push(row);
}

const canExport = computed(() => {
  for (let row of grid.value) {
    for (let cell of row) {
      if (cell === undefined) continue;
      if (cell.symbol.text !== "" && cell.color !== "black") {
        return false;
      }
    }
  }
  return true;
});

const setDimensions = () => {
  // Validate input
  const [x, y] = [parseInt(inputRowCount.value), parseInt(inputColCount.value)];

  if (isNaN(x) || isNaN(y) || x < 1 || y < 1) {
    alert("Please enter valid positive integers for dimensions.");
    return;
  }

  const newRowCount = x;
  const newColCount = y;

  const newGrid: CellData[][] = [];
  for (let i = 0; i < newRowCount; i++) {
    const row: CellData[] = [];
    for (let j = 0; j < newColCount; j++) {
      const oldRow = grid.value[i] || [];
      if (i < grid.value.length && j < oldRow.length) {
        const cell = oldRow[j];
        if (cell) {
          row.push(cell);
        } else {
          row.push(createEmptyCell());
        }
      } else {
        row.push(createEmptyCell());
      }
    }
    newGrid.push(row);
  }

  grid.value = newGrid;
  rowCount.value = newRowCount;
  colCount.value = newColCount;
};

const downloadObjectAsJson = (exportObj: object, exportName: string) => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(exportObj));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const exportGrid = () => {
  if (!canExport.value) {
    alert("cannot export: numbers can only be on black cells");
    return;
  }
  const grid2 = grid.value.map((row) => {
    return row.map((cell) => {
      return cell.color === "white"
        ? "."
        : cell.symbol.text === ""
          ? "#"
          : cell.symbol.text;
    });
  });
  console.log(grid2);
  const exportData = {
    type: "akari",
    grid: grid2,
  };
  downloadObjectAsJson(exportData, "akari-puzzle");
};

const onClickCell = (cell: CellData) => {
  switch (currentTool.value) {
    case "symbols":
      {
        const prev = cell.symbol.text;
        cell.symbol.text = {
          "": "0",
          "0": "1",
          "1": "2",
          "2": "3",
          "3": "4",
          "4": "",
        }[prev] as CellText;
      }
      break;
    case "colors":
      {
        const prev = cell.color;
        if (prev === "black") {
          cell.color = "white";
        } else {
          cell.color = "black";
        }
      }
      break;
  }
};
</script>

<style scoped>
.grid-wrapper {
  padding: 12px;
}

.grid-row {
  display: flex;
  flex-direction: row;
}

.cell {
  border: 1px solid #ccc;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -moz-user-select: none;
}

.cell-color-white {
  background-color: white;
}

.cell-color-black {
  background-color: black;
  color: white;
}
</style>
