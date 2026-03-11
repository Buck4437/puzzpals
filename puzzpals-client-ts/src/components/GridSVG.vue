<template>
  <svg
    class="svg-grid"
    :width="size"
    :height="size"
    :viewBox="viewBoxStr"
    xmlns="http://www.w3.org/2000/svg"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mousemove="handlePointerMove"
    @mouseleave="handleMouseLeave"
  >
    <g v-for="layer in layers">
      <!-- Surface objects -->
      <rect
        v-for="surface in layer.surfaceObjects"
        :key="`surface-${surface.location}`"
        :x="toSvgCoordinates(topLeft(surface.location))[0]"
        :y="toSvgCoordinates(topLeft(surface.location))[1]"
        :width="cellSize"
        :height="cellSize"
        :fill="surface.color"
        pointer-events="none"
      />

      <!-- Vertical lines -->
      <line
        v-for="col in props.gridSize[1] + 1"
        :key="`grid-v-line-${col}`"
        :x1="toSvgCoordinates([0, col - 1])[0]"
        :y1="toSvgCoordinates([0, col - 1])[1]"
        :x2="toSvgCoordinates([props.gridSize[0], col - 1])[0]"
        :y2="toSvgCoordinates([props.gridSize[0], col - 1])[1]"
        stroke="black"
        :stroke-width="col === 1 || col === props.gridSize[1] + 1 ? 3 : 1"
        pointer-events="none"
      />

      <!-- Horizontal lines -->
      <line
        v-for="row in props.gridSize[0] + 1"
        :key="`grid-h-line-${row}`"
        :x1="toSvgCoordinates([row - 1, 0])[0]"
        :y1="toSvgCoordinates([row - 1, 0])[1]"
        :x2="toSvgCoordinates([row - 1, props.gridSize[1]])[0]"
        :y2="toSvgCoordinates([row - 1, props.gridSize[1]])[1]"
        stroke="black"
        :stroke-width="row === 1 || row === props.gridSize[0] + 1 ? 3 : 1"
        pointer-events="none"
      />

      <!-- Line objects -->
      <line
        v-for="line in layer.lineObjects"
        :key="`line-${line.start}-${line.end}`"
        :x1="toSvgCoordinates(line.start)[0]"
        :y1="toSvgCoordinates(line.start)[1]"
        :x2="toSvgCoordinates(line.end)[0]"
        :y2="toSvgCoordinates(line.end)[1]"
        :stroke="line.color"
        :stroke-width="3"
        pointer-events="none"
      />

      <!-- symbol objects -->
      <g
        v-for="symbol in layer.symbolObjects"
        :key="`symbol-${symbol.location}`"
        :transform="`translate(${toSvgCoordinates(symbol.location)[0]}, ${toSvgCoordinates(symbol.location)[1]})`"
        pointer-events="none"
      >
        <text
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="cellSize / 2"
          :fill="symbol.color"
        >
          {{ symbol.content }}
        </text>
      </g>

      <!-- Cursor -->
      <rect
        v-if="props.cursor"
        :x="toSvgCoordinates(topLeft(props.cursor))[0]"
        :y="toSvgCoordinates(topLeft(props.cursor))[1]"
        :width="cellSize"
        :height="cellSize"
        fill="none"
        stroke="red"
        stroke-width="5"
        opacity="0.7"
        pointer-events="none"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import {
  type Grid,
  type Coordinate,
  type LayerData,
} from "@puzzpals/puzzle-models";
import { ref, computed } from "vue";

const FULLSIZE = 480;
const PADDING = 20;

const VIEW_BOX_SIZE = FULLSIZE + 2 * PADDING;
const viewBoxStr = ref(
  `-${PADDING} -${PADDING} ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
);

let isDragging = false;

/*
    Grid file uses [r, c]
    SVG uses [x, y]
*/

function toSvgCoordinates(coordinate: [number, number]): [number, number] {
  const r = coordinate[0];
  const c = coordinate[1];
  return [
    c * cellSize.value + offsetX.value,
    r * cellSize.value + offsetY.value,
  ];
}

function toGridCoordinates(coordinate: [number, number]): [number, number] {
  const x = coordinate[0] - offsetX.value;
  const y = coordinate[1] - offsetY.value;
  return [y / cellSize.value, x / cellSize.value];
}

const props = defineProps<{
  size: number;
  layers: LayerData[];
  gridSize: [number, number];
  cursor?: Coordinate | null;
}>();

const emit = defineEmits<{
  centerCellClick: [cell: [number, number]];
  centerCellEnter: [cell: [number, number]];
  cornerCellClick: [corner: [number, number]];
  cornerCellEnter: [corner: [number, number]];
  mouseRelease: [];
}>();

const cellSize = computed(
  () => FULLSIZE / Math.max(props.gridSize[0], props.gridSize[1]),
);

const gridWidth = computed(() => props.gridSize[1] * cellSize.value); // numCols * cellSize
const gridHeight = computed(() => props.gridSize[0] * cellSize.value); // numRows * cellSize

const offsetX = computed(() => (FULLSIZE - gridWidth.value) / 2);
const offsetY = computed(() => (FULLSIZE - gridHeight.value) / 2);

let lastCenterCell: [number, number] | null = null;
let lastCornerCell: [number, number] | null = null;

// Returns [x, y] in SVG coordinate system (x=horizontal, y=vertical)
function getGridCoordinatesFromEvent(event: MouseEvent): [number, number] {
  const svg = event.currentTarget as SVGSVGElement;
  const rect = svg.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const scaleX = VIEW_BOX_SIZE / rect.width;
  const scaleY = VIEW_BOX_SIZE / rect.height;
  const viewX = x * scaleX - PADDING;
  const viewY = y * scaleY - PADDING;

  return toGridCoordinates([viewX, viewY]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toCenterCell(coord: [number, number]): [number, number] {
  const [r, c] = coord;

  const r1 = clamp(Math.floor(r) + 0.5, 0.5, props.gridSize[0] - 0.5);
  const c1 = clamp(Math.floor(c) + 0.5, 0.5, props.gridSize[1] - 0.5);

  return [r1, c1];
}

function toCornerCell(coord: [number, number]): [number, number] {
  const [r, c] = coord;

  const r1 = clamp(Math.round(r), 0, props.gridSize[0] - 1);
  const c1 = clamp(Math.round(c), 0, props.gridSize[1] - 1);

  return [r1, c1];
}

function sameCoordinate(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function isWithinSnapRadius(
  coord: [number, number],
  target: [number, number],
  radius: number,
): boolean {
  const dr = coord[0] - target[0];
  const dc = coord[1] - target[1];
  return Math.hypot(dr, dc) <= radius;
}

function handleMouseDown(event: MouseEvent) {
  isDragging = true;
  const coord = getGridCoordinatesFromEvent(event);
  const centerCell = toCenterCell(coord);
  const cornerCell = toCornerCell(coord);

  lastCenterCell = centerCell;
  lastCornerCell = cornerCell;

  emit("centerCellClick", centerCell);
  emit("cornerCellClick", cornerCell);
  emit("centerCellEnter", centerCell);
  emit("cornerCellEnter", cornerCell);
}

function handleMouseUp() {
  isDragging = false;
  emit("mouseRelease");
}

function handleMouseLeave() {
  isDragging = false;
  lastCenterCell = null;
  lastCornerCell = null;
}

function handlePointerMove(event: MouseEvent) {
  if (!isDragging) return;

  const coord = getGridCoordinatesFromEvent(event);
  const centerCell = toCenterCell(coord);
  const cornerCell = toCornerCell(coord);
  const snapRadius = 0.5;
  const nearCenter = isWithinSnapRadius(coord, centerCell, snapRadius);
  const nearCorner = isWithinSnapRadius(coord, cornerCell, snapRadius);

  if (nearCenter) {
    if (
      lastCenterCell === null ||
      !sameCoordinate(lastCenterCell, centerCell)
    ) {
      lastCenterCell = centerCell;
      emit("centerCellEnter", centerCell);
    }
  } else {
    lastCenterCell = null;
  }

  if (nearCorner) {
    if (
      lastCornerCell === null ||
      !sameCoordinate(lastCornerCell, cornerCell)
    ) {
      lastCornerCell = cornerCell;
      emit("cornerCellEnter", cornerCell);
    }
  } else {
    lastCornerCell = null;
  }
}

function topLeft(coordinate: [number, number]): [number, number] {
  return [coordinate[0] - 0.5, coordinate[1] - 0.5];
}
</script>

<style scoped>
svg text {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
