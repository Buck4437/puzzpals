<template>
  <div class="cell" 
    :class="classObject" 
    role="button" 
    tabindex="0" 
    @click="onLeftClick"
    @keydown.enter.prevent="onLeftClick" 
    @keydown.space.prevent="onLeftClick" 
    @contextmenu.prevent="onRightClick"
  >
    {{ cell.text }}
  </div>
</template>

<script setup lang="ts">
import Cell from '@/models/Cell';
import { computed } from 'vue';

const props = defineProps({
  cell: { type: Cell, required: true }
});

const classObject = computed(() => ({
  'black': props.cell.isBlack,
  'white': !props.cell.isBlack,
  'lit': props.cell.isLit,
  'number-error': props.cell.hasNumberError,
  'bulb-error': props.cell.hasBulbError,
}));

const emit = defineEmits(['leftClick', 'rightClick']);

function onLeftClick() {
  emit('leftClick', props.cell);
}

function onRightClick() {
  emit('rightClick', props.cell);
}
</script>

<style scoped>
.cell {
  aspect-ratio: 1;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 1.5rem;
  border: 1px solid #ddd;
  cursor: pointer;
}

.black {
  background-color: black;
  color: white;
}

.black.number-error {
  color: #ff7f7f;
}

.white {
  background-color: white;
  color: black;
}

.white.lit {
  background-color: #ffff7f;
}

.white.bulb-error {
  background-color: #7f0000;
}
</style>