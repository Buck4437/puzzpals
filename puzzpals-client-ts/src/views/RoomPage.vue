<template>
  <div v-if="!gridState">Joining room...</div>
  <div v-else>
    <h2>Room {{ token }}</h2>
    <button @click="leave">Leave</button>
    <AkariGrid :grid-state="gridState" @update-cell="onCellUpdated" ref="gridComponent" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, ref, type Ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import api from '@/services/api';
import socket from '@/socket';

import AkariGrid from '@/components/AkariGrid.vue';
import type CellState from '@/models/CellState';
import type GridState from '@/models/GridState';

const router = useRouter();
const gridState: Ref<GridState | null> = ref(null);
const gridComponent = useTemplateRef("gridComponent");

const props = defineProps({
  token: { type: String, required: true }
});

function is404(err: unknown) {
  return typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof err.response === 'object' &&
    err.response !== null &&
    'status' in err.response &&
    err.response.status === 404;
}

async function fetchRoom() {
  try {
    // Check that the room exists
    await api.get(`/rooms/${props.token}`);
  } catch (err) {
    if (is404(err)) {
      router.push('/404');
    } else {
      console.error(err);
      router.push('/');
    }
  }
}

async function join() {
  socket.emit('room:join', { token: props.token });
}

async function leave() {
  socket.emit('room:leave', { token: props.token });
  router.push('/');
}

function onCellUpdated(idx: number, value: CellState) {
  socket.emit('grid:updateCell', { token: props.token, idx, value });
}

function initiateSocket() {
  socket.on('grid:state', (data: GridState) => {
    gridState.value = data;
  });

  socket.on('grid:cellUpdated', (data: { idx: number, value: CellState; }) => {
    if (gridComponent.value === null) {
      throw new Error("Grid is missing");
    }
    const { idx, value } = data;
    gridComponent.value.onCellUpdated(idx, value);
  });
}

onBeforeMount(initiateSocket);

onMounted(async () => {
  await fetchRoom();
  console.log(`Joining room ${props.token}`);
  await join();
});

onBeforeUnmount(() => {
  socket.emit('room:leave', { token: props.token });
  socket.off("grid:state");
  socket.off("grid:cellUpdated");
});
</script>
