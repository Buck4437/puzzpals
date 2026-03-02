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
  <GridSVG :size="480" :grid="grid" @center-cell-click="logCenterCellClick" />
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from "vue";

import GridSVG from "@/components/GridSVG.vue";
import type { Coordinate, Grid } from "@/models/Grid";

const rowCount = ref(6);
const colCount = ref(7);
const inputRowCount: Ref<Number> = ref(6);
const inputColCount: Ref<Number> = ref(7);

const tools = ["colors", "symbols"];
const currentTool = ref(tools[0]);

const grid = ref<Grid>({
  size: [rowCount.value, colCount.value],
  problem: {
    lineObjects: [],
    surfaceObjects: [],
    symbolObjects: [],
  },
});

const canExport = computed(() => {
  return true;
});

const setDimensions = () => {
  // Validate input
  const [x, y] = [inputRowCount.value, inputColCount.value];

  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    x <= 0 ||
    y <= 0 ||
    x > 100 ||
    y > 100
  ) {
    alert("Please enter valid positive integers for dimensions (1-100).");
    return;
  }

  const newRowCount = x;
  const newColCount = y;

  grid.value.size = [newRowCount, newColCount];

  // Remove objects that are out of bounds
  grid.value.problem.lineObjects = grid.value.problem.lineObjects.filter(
    (line) =>
      line.start[0] < newRowCount &&
      line.start[1] < newColCount &&
      line.end[0] < newRowCount &&
      line.end[1] < newColCount,
  );

  grid.value.problem.surfaceObjects = grid.value.problem.surfaceObjects.filter(
    (surface) =>
      surface.location[0] < newRowCount && surface.location[1] < newColCount,
  );

  grid.value.problem.symbolObjects = grid.value.problem.symbolObjects.filter(
    (symbol) =>
      symbol.location[0] < newRowCount && symbol.location[1] < newColCount,
  );

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
  return;
  // const grid2 = grid.value.map((row) => {
  //   return row.map((cell) => {
  //     return cell.color === "white"
  //       ? "."
  //       : cell.symbol.text === ""
  //         ? "#"
  //         : cell.symbol.text;
  //   });
  // });
  // console.log(grid2);
  // const exportData = {
  //   type: "akari",
  //   grid: grid2,
  // };
  // downloadObjectAsJson(exportData, "akari-puzzle");
};

const logCenterCellClick = (coordinate: Coordinate) => {
  switch (currentTool.value) {
    case "symbols":
      {
        const prev = grid.value.problem.symbolObjects.find(
          (cell) =>
            cell.location[0] === coordinate[0] &&
            cell.location[1] === coordinate[1],
        );

        const newSymbol =
          {
            "": "0",
            "0": "1",
            "1": "2",
            "2": "3",
            "3": "4",
            "4": "",
          }[prev?.content || ""] || "";

        if (prev) {
          grid.value.problem.symbolObjects =
            grid.value.problem.symbolObjects.map((cell) => {
              if (
                cell.location[0] === coordinate[0] &&
                cell.location[1] === coordinate[1]
              ) {
                return { ...cell, content: newSymbol };
              }
              return cell;
            });
        } else {
          if (newSymbol === "") {
            return;
          }
          const textColor =
            grid.value.problem.surfaceObjects.find(
              (cell) =>
                cell.location[0] === coordinate[0] &&
                cell.location[1] === coordinate[1],
            )?.color === "black"
              ? "white"
              : "black";

          grid.value.problem.symbolObjects.push({
            location: coordinate,
            content: newSymbol,
            color: textColor,
          });
        }
      }
      break;
    case "colors":
      {
        const prev = grid.value.problem.surfaceObjects.find(
          (cell) =>
            cell.location[0] === coordinate[0] &&
            cell.location[1] === coordinate[1],
        );
        if (prev?.color === "black") {
          grid.value.problem.surfaceObjects =
            grid.value.problem.surfaceObjects.map((cell) => {
              if (
                cell.location[0] === coordinate[0] &&
                cell.location[1] === coordinate[1]
              ) {
                return { ...cell, color: "white" };
              }
              return cell;
            });
          // Change the text to black as well
          grid.value.problem.symbolObjects =
            grid.value.problem.symbolObjects.map((cell) => {
              if (
                cell.location[0] === coordinate[0] &&
                cell.location[1] === coordinate[1]
              ) {
                return { ...cell, color: "black" };
              }
              return cell;
            });
        } else {
          // Change the text to white as well
          grid.value.problem.symbolObjects =
            grid.value.problem.symbolObjects.map((cell) => {
              if (
                cell.location[0] === coordinate[0] &&
                cell.location[1] === coordinate[1]
              ) {
                return { ...cell, color: "white" };
              }
              return cell;
            });
          if (prev === undefined) {
            grid.value.problem.surfaceObjects.push({
              location: coordinate,
              color: "black",
            });
            return;
          }
          grid.value.problem.surfaceObjects =
            grid.value.problem.surfaceObjects.map((cell) => {
              if (
                cell.location[0] === coordinate[0] &&
                cell.location[1] === coordinate[1]
              ) {
                return { ...cell, color: "black" };
              }
              return cell;
            });
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
  cursor: pointer;
}

.cell-color-white {
  background-color: white;
}

.cell-color-black {
  background-color: black;
  color: white;
}

button.active {
  background-color: aqua;
  color: black;
}
</style>
