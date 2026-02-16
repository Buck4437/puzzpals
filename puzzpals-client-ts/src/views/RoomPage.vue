<template>
  <div v-if="!initialGridState">Joining room...</div>
  <div v-else>
    <h2>Room {{ token }}</h2>
    <button @click="leaveRoom">Leave</button>
    <PuzzleArea
      :initial-grid-state="initialGridState"
      @update-cell="onCellUpdated"
      ref="areaComponent"
    ></PuzzleArea>
    <Chat
      :chat-state="chatState"
      :userID="userID"
      @newMessage="onChatSubmit"
      ref="chatComponent"
    />
  </div>
</template>

<script setup lang="ts">
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
  useTemplateRef,
} from "vue";
import { useRouter } from "vue-router";

import api from "@/services/api";
import socket from "@/socket";
import PuzzleArea from "@/components/PuzzleArea.vue";

import type CellState from "@/models/CellState";
import type GridState from "@/models/GridState";
import Chat from "@/components/Chat.vue";
import type ChatState from "@/models/ChatState";

const router = useRouter();

const initialGridState: Ref<GridState | null> = ref(null);
const areaComponent = useTemplateRef("areaComponent");

const chatState: Ref<ChatState> = ref({ messages: [] });
const chatComponent = useTemplateRef("chatComponent");

const userID = ref<string | null>(null);
const props = defineProps({
  token: { type: String, required: true },
});

function is404(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof err.response === "object" &&
    err.response !== null &&
    "status" in err.response &&
    err.response.status === 404
  );
}

async function checkRoomExists() {
  try {
    // Check that the room exists
    await api.get(`/rooms/${props.token}`);
  } catch (err) {
    if (is404(err)) {
      router.push("/404");
    } else {
      console.error(err);
      router.push("/");
    }
  }
}

async function joinRoom() {
  socket.emit("room:join", props.token);
}

async function leaveRoom() {
  socket.emit("room:leave", props.token);
  router.push("/");
}

function onCellUpdated(idx: number, value: CellState) {
  socket.emit("grid:updateCell", idx, value.input);
}

function onChatSubmit(text: string) {
  if (userID.value) {
    const message = { msgtext: text, user: userID.value };
    socket.emit("chat:newMessage", message);
  }
}

function initiateSocket() {
  socket.on("room:initialize", (data: GridState, id: string) => {
    initialGridState.value = data;
    userID.value = id;
  });

  socket.on("grid:cellUpdated", (idx: number, value: number) => {
    if (areaComponent.value === null) {
      throw new Error("areaComponent is missing");
    }

    // For now, grid:cellUpdated accepts only the input instead of the whole cell state
    // because the input is the only thing the player can modify.
    // We reconstruct the cell state from the input and pass it to the grid.

    // If later the player can modify more things (e.g., text and background color)
    // and grid:cellUpdated needs to accept the whole cell state,
    // then we can remove the reconstruction step.

    const newState: CellState = {
      isBlack: false,
      number: null,
      input: value,
    };

    areaComponent.value.onCellUpdated(idx, newState);
  });

  // socket.on('chat:records', (history) => {
  //   if (chatComponent.value === null) {
  //     throw new Error("Chat Block is missing");
  //   }
  //   chatState.value.messages.splice(0, chatState.value.messages.length, ...history);
  //   chatComponent.value.scrollToBottom();
  // });

  socket.on("chat:messageNew", (msgBlock) => {
    if (chatComponent.value === null) {
      throw new Error("Chat Block is missing");
    }
    chatState.value.messages.push(msgBlock);
    chatComponent.value.scrollToBottom();
  });
}

onBeforeMount(initiateSocket);

onMounted(async () => {
  await checkRoomExists();
  console.log(`Joining room ${props.token}`);
  await joinRoom();
});

onBeforeUnmount(() => {
  socket.emit("room:leave", props.token);
  socket.off();
});
</script>
