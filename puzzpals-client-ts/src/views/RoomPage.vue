<template>
  <div v-if="!gameData">Joining room...</div>
  <div v-else>
    <h2>Room {{ token }}</h2>
    <button @click="leaveRoom">Leave</button>
    <PuzzleArea
      :grid="gameData.puzzle"
      :player-solution="gameData.playerSolution"
      @edit-message="onGridEdited"
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
import { onBeforeMount, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import { useRouter } from "vue-router";

import api from "@/services/api";
import socket from "@/socket";
import PuzzleArea from "@/components/PuzzleArea.vue";

import Chat from "@/components/Chat.vue";
import type ChatState from "@/models/ChatState";
import {
  applyEditMessage,
  toEditMessage,
  type EditMessage,
  type GameData,
} from "@puzzpals/puzzle-models";

const router = useRouter();

const gameData: Ref<GameData | null> = ref(null);

const chatState: Ref<ChatState> = ref({ messages: [] });
const chatComponent = ref<InstanceType<typeof Chat> | null>(null);

const userID = ref<string | null>(null);
const props = defineProps({
  token: { type: String, required: true },
});

async function checkRoomExists() {
  try {
    // Check that the room exists
    const res = await api.get(`/rooms/${props.token}/exists`);
    if (res.data.exists === false) router.push("/404");
  } catch (err) {
    console.error(err);
    router.push("/");
  }
}

async function joinRoom() {
  socket.emit("room:join", props.token);
}

async function leaveRoom() {
  socket.disconnect();
  router.push("/");
}

function applyIncomingEdit(message: EditMessage) {
  if (gameData.value === null) {
    return;
  }

  console.log(message);

  gameData.value = {
    ...gameData.value,
    playerSolution: applyEditMessage(gameData.value.playerSolution, message),
  };
}

function onGridEdited(message: EditMessage) {
  applyIncomingEdit(message);
  socket.emit("grid:edit", message);
}

function onChatSubmit(text: string) {
  const message = { msgtext: text };
  socket.emit("chat:newMessage", message);
}

function initiateSocket() {
  socket.on("room:initialize", (data: GameData, id: string) => {
    gameData.value = data;
    userID.value = id;
  });

  socket.on("grid:edited", (payload: unknown) => {
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("messageType" in payload) ||
      !("type" in payload) ||
      !("data" in payload)
    ) {
      return;
    }

    const message = toEditMessage(
      payload.messageType,
      payload.type,
      payload.data,
    );

    if (message !== null) {
      applyIncomingEdit(message);
    }
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
  socket.disconnect();
  socket.off();
});
</script>
