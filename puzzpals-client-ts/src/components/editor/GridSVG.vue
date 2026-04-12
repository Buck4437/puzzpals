<template>
  <svg
    class="svg-grid"
    :width="displayedSize"
    :height="displayedSize"
    :viewBox="viewBoxStr"
    xmlns="http://www.w3.org/2000/svg"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mousemove="handlePointerMove"
    @mouseleave="handleMouseLeave"
  >
    <!--
    Why use `background-${index}` and `foreground-${index}`:
    https://vuejs.org/api/built-in-special-attributes.html#key
    "Children of the same common parent must have unique keys."
    "Duplicate keys will cause render errors."
    -->

    <g v-for="(layer, index) in layers" :key="`background-${index}`">
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
    </g>

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

    <g v-for="(layer, index) in layers" :key="`foreground-${index}`">
      <!-- text objects -->
      <g
        v-for="textObject in layer.textObjects"
        :key="`text-${textObject.location}`"
        :transform="`translate(${toSvgCoordinates(textObject.location)[0]}, ${toSvgCoordinates(textObject.location)[1]})`"
        pointer-events="none"
      >
        <text
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="cellSize / 2"
          :fill="textObject.color"
        >
          {{ textObject.content }}
        </text>
      </g>

      <!-- shape objects -->
      <g
        v-for="shapeObject in layer.shapeObjects"
        :key="`shape-${shapeObject.location}`"
        :transform="`translate(${toSvgCoordinates(shapeObject.location)[0]}, ${toSvgCoordinates(shapeObject.location)[1]})`"
        pointer-events="none"
      >
        <image
          v-if="getShapeRenderMode(shapeObject.content) === 'image'"
          :href="getShapeImageAsset(shapeObject.content) ?? undefined"
          :x="-cellSize / 2.5"
          :y="-cellSize / 2.5"
          :width="(2 * cellSize) / 2.5"
          :height="(2 * cellSize) / 2.5"
          preserveAspectRatio="xMidYMid meet"
        />
        <text
          v-else
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="central"
          :font-size="cellSize / 2"
          fill="black"
        >
          {{ getShapeGlyph(shapeObject.content) }}
        </text>
      </g>

      <!-- Line objects -->
      <line
        v-for="line in layer.lineObjects"
        :key="`line-${line.endpoints[0]}-${line.endpoints[1]}`"
        :x1="toSvgCoordinates(line.endpoints[0])[0]"
        :y1="toSvgCoordinates(line.endpoints[0])[1]"
        :x2="toSvgCoordinates(line.endpoints[1])[0]"
        :y2="toSvgCoordinates(line.endpoints[1])[1]"
        :stroke="line.color"
        :stroke-width="line.thickness || 3"
        pointer-events="none"
      />
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
  </svg>
</template>

<script setup lang="ts">
import {
  type Coordinate,
  type LayerData,
  type ShapeInfo,
  getSpecialCharacterById,
} from "@puzzpals/puzzle-models";
import { computed } from "vue";
import blackCircleBigAsset from "@/assets/svg/black_circle_big.svg";
import whiteCircleBigAsset from "@/assets/svg/white_circle_big.svg";

const SHAPE_IMAGE_ASSETS: Record<string, string> = {
  white_circle_big: whiteCircleBigAsset,
  black_circle_big: blackCircleBigAsset,
};

const PADDING = 20;

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
  layers: LayerData[]; // Layers that come later will be rendered on top of layers that come earlier
  gridSize: [number, number];
  displaySize?: number | null; // If not provided, will size based on gridSize
  cursor?: Coordinate | null;
}>();

const BASE_GRID_SIZE_PX = 480;
const BASE_GRID_DIMENSION = 10;

const fullSize = computed(() => {
  const [rows, cols] = props.gridSize;
  const maxDimension = Math.max(rows, cols, 1);

  if (maxDimension <= BASE_GRID_DIMENSION) {
    return BASE_GRID_SIZE_PX;
  }

  const pixelsPerCell = BASE_GRID_SIZE_PX / BASE_GRID_DIMENSION;
  return Math.round(maxDimension * pixelsPerCell);
});

const displayedSize = computed(() => {
  const requestedSize = props.displaySize ?? fullSize.value;
  return Number.isFinite(requestedSize) ? Math.max(requestedSize, 1) : 1;
});

const viewBoxSize = computed(() => fullSize.value + 2 * PADDING);
const viewBoxStr = computed(
  () => `-${PADDING} -${PADDING} ${viewBoxSize.value} ${viewBoxSize.value}`,
);

const emit = defineEmits<{
  centerCellClick: [cell: [number, number]];
  centerCellEnter: [cell: [number, number]];
  centerCellHover: [cell: [number, number] | null];
  cornerCellClick: [corner: [number, number]];
  cornerCellEnter: [corner: [number, number]];
  mouseRelease: [];
}>();

const cellSize = computed(
  () => fullSize.value / Math.max(props.gridSize[0], props.gridSize[1]),
);

const gridWidth = computed(() => props.gridSize[1] * cellSize.value); // numCols * cellSize
const gridHeight = computed(() => props.gridSize[0] * cellSize.value); // numRows * cellSize

const offsetX = computed(() => (fullSize.value - gridWidth.value) / 2);
const offsetY = computed(() => (fullSize.value - gridHeight.value) / 2);

let lastCenterCell: [number, number] | null = null;
let lastCornerCell: [number, number] | null = null;

// Returns [x, y] in SVG coordinate system (x=horizontal, y=vertical)
function getGridCoordinatesFromEvent(event: MouseEvent): [number, number] {
  const svg = event.currentTarget as SVGSVGElement;
  const rect = svg.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const scaleX = viewBoxSize.value / rect.width;
  const scaleY = viewBoxSize.value / rect.height;
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

  const r1 = clamp(Math.round(r), 0, props.gridSize[0]);
  const c1 = clamp(Math.round(c), 0, props.gridSize[1]);

  return [r1, c1];
}

function sameCoordinate(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function isWithinGridBounds(coord: [number, number]): boolean {
  const [r, c] = coord;
  return r >= 0 && r <= props.gridSize[0] && c >= 0 && c <= props.gridSize[1];
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
  const coord = getGridCoordinatesFromEvent(event);
  if (!isWithinGridBounds(coord)) {
    isDragging = false;
    lastCenterCell = null;
    lastCornerCell = null;
    return;
  }

  isDragging = true;
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
  emit("centerCellHover", null);
}

function handlePointerMove(event: MouseEvent) {
  const coord = getGridCoordinatesFromEvent(event);
  if (!isWithinGridBounds(coord)) {
    lastCenterCell = null;
    lastCornerCell = null;
    emit("centerCellHover", null);
    return;
  } else {
    emit("centerCellHover", toCenterCell(coord));
  }

  if (!isWithinGridBounds(coord)) {
    emit("centerCellHover", null);
  }

  if (!isDragging) {
    return;
  }

  const centerCell = toCenterCell(coord);
  const cornerCell = toCornerCell(coord);
  const snapRadius = 0.5;
  const nearCenter =
    isWithinGridBounds(coord) &&
    isWithinSnapRadius(coord, centerCell, snapRadius);
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

function isImageShape(shape: ShapeInfo | null): shape is ShapeInfo & {
  imageAsset: string;
} {
  return shape !== null && "imageAsset" in shape;
}

function isTextShape(shape: ShapeInfo | null): shape is ShapeInfo & {
  textGlyph: string;
} {
  return shape !== null && "textGlyph" in shape;
}

function getShapeGlyph(shapeId: string): string {
  const shape = getSpecialCharacterById(shapeId);
  return isTextShape(shape) ? shape.textGlyph : "?";
}

function getShapeRenderMode(shapeId: string): "text" | "image" {
  const shape = getSpecialCharacterById(shapeId);
  return isImageShape(shape) ? "image" : "text";
}

function getShapeImageAsset(shapeId: string): string | null {
  const shape = getSpecialCharacterById(shapeId);
  if (!isImageShape(shape)) {
    return null;
  }

  return SHAPE_IMAGE_ASSETS[shape.imageAsset] ?? null;
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
