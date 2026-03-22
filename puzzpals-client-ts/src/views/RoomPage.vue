<template>
  <div v-if="!gameData" class="joining-text">Joining room {{ token }}...</div>
  <div v-else>
    <div class="solving-page">
      <header class="top-bar">
        <h1>Puzzpals</h1>
        <span class="room-id">Room ID: {{ token }}</span>
        <button @click="leaveRoom">Leave</button>
      </header>

      <div class="content">
        <div class="puzzle-pane">
          <div class="left-inner">
            <PuzzleArea
              :grid="gameData.puzzle"
              :player-solution="gameData.playerSolution"
              @edit-message="onGridEdited"
            ></PuzzleArea>
          </div>
        </div>

        <div class="info-pane">
          <!--
                <div class="player-info">
                    Player info here
                </div>
              -->

          <div class="chat-con">
            <Chat
              :chat-state="chatState"
              :userID="userID"
              @newMessage="onChatSubmit"
              ref="chatComponent"
            />
          </div>
        </div>
      </div>
    </div>
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

<style scoped>
.joining-text {
  font-size: 1.5rem;
  text-align: center;
  margin-top: 2rem;
}

button {
  min-width: 100px;
}

input {
  min-width: 50px;
}

.solving-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: linear-gradient(90deg, #26cda9, #2b8de2);
  color: #fff;
  padding: 12px 16px;
  height: 48px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  justify-content: space-between;
  position: relative;
}

.room-id {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  text-align: center;
  pointer-events: none;
}

.content {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  background: #f7f8fb;
}

.puzzle-pane {
  flex: 1 1 60%;
  min-width: 0;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 12px;
  box-sizing: border-box;
  overflow: auto;
}

.info-pane {
  flex: 1 1 40%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.player-info {
  height: 100px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 12px;
  box-sizing: border-box;
  overflow: auto;
}

.chat-con {
  flex: 1 1;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}
</style>
