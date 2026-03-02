<template>
  <svg
    class="svg-grid"
    :width="width"
    :height="height"
    viewBox="-20 -20 520 520"
    pointer-events="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Surface objects -->
    <rect
      v-for="surface in props.grid.problem.surfaceObjects"
      :key="`surface-${surface.location}`"
      :x="toSvgCoordinates(topLeft(surface.location))[0]"
      :y="toSvgCoordinates(topLeft(surface.location))[1]"
      :width="cellWidth"
      :height="cellHeight"
      :fill="surface.color"
    />

    <!-- Vertical lines -->
    <line
      v-for="x in props.grid.size[0] + 1"
      :key="`grid-v-line-${x}`"
      :x1="toSvgCoordinates([x - 1, 0])[0]"
      :y1="0"
      :x2="toSvgCoordinates([x - 1, 0])[0]"
      :y2="480"
      stroke="black"
      :stroke-width="x === 1 || x === props.grid.size[0] + 1 ? 3 : 1"
    />

    <!-- Horizontal lines -->
    <line
      v-for="y in props.grid.size[1] + 1"
      :key="`grid-h-line-${y}`"
      :x1="0"
      :y1="toSvgCoordinates([0, y - 1])[1]"
      :x2="480"
      :y2="toSvgCoordinates([0, y - 1])[1]"
      stroke="black"
      :stroke-width="y === 1 || y === props.grid.size[1] + 1 ? 3 : 1"
    />

    <!-- Line objects -->
    <line
      v-for="line in props.grid.problem.lineObjects"
      :key="`line-${line.start}-${line.end}`"
      :x1="toSvgCoordinates(line.start)[0]"
      :y1="toSvgCoordinates(line.start)[1]"
      :x2="toSvgCoordinates(line.end)[0]"
      :y2="toSvgCoordinates(line.end)[1]"
      :stroke="line.color"
      :stroke-width="3"
    />

    <!-- Cell objects -->
    <g
      v-for="cell in props.grid.problem.cellObjects"
      :key="`cell-${cell.location}`"
      :transform="`translate(${toSvgCoordinates(cell.location)[0]}, ${toSvgCoordinates(cell.location)[1]})`"
    >
      <text
        x="0"
        y="0"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="cellWidth / 2"
        :fill="cell.color"
      >
        {{ cell.content }}
      </text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { type Grid } from "../models/Grid";
import { computed } from "vue";

const props = defineProps<{
  width: number;
  height: number;
  grid: Grid;
}>();

const emit = defineEmits(["updateCell"]);

const cellWidth = computed(() => 480 / props.grid.size[0]);
const cellHeight = computed(() => 480 / props.grid.size[1]);

function topLeft(coordinate: [number, number]): [number, number] {
  return [coordinate[0] - 0.5, coordinate[1] - 0.5];
}

// Odd number: Refers to centers
// Even number: Refers to edges
function toSvgCoordinates(coordinate: [number, number]): [number, number] {
  return [coordinate[0] * cellWidth.value, coordinate[1] * cellHeight.value];
}
</script>

<style scoped>
.grid-wrapper {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 12px;
}

.grid {
  display: grid;
}
</style>
