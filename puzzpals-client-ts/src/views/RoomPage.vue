<template>
  <div v-if="!gameData" class="joining-text">Joining room {{ token }}...</div>
  <div v-else>
    <div class="solving-page">
      <header class="top-bar">
        <h1>Puzzpals</h1>
        <span class="room-id">Room ID: {{ token }}</span>
        <div class="top-actions">
          <button @click="showRoomDetails = true">Details</button>
          <button @click="leaveRoom">Leave</button>
        </div>
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
          <div class="info-collapsibles">
            <details class="panel" v-if="enabledRulesInfo.length > 0">
              <summary>
                Pre-defined rules <span>({{ enabledRulesInfo.length }})</span>
              </summary>
              <ul>
                <li v-for="rule in enabledRulesInfo" :key="rule.id">
                  <strong>{{ rule.name }}</strong
                  >: {{ rule.description }}
                </li>
              </ul>
            </details>

            <details class="panel" v-if="answerCheckInfo.length > 0">
              <summary>
                Answer checks <span>({{ answerCheckInfo.length }})</span>
              </summary>
              <ul>
                <li v-for="check in answerCheckInfo" :key="check.type">
                  <strong>{{ check.name }}</strong
                  >: {{ check.description }}
                </li>
              </ul>
            </details>
          </div>

          <div class="chat-con">
            <ChatRoom
              :chat-state="chatState"
              :userID="userID"
              @newMessage="onChatSubmit"
              ref="chatComponent"
            />
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-if="showRoomDetails" @close="showRoomDetails = false">
      <div class="details-modal">
        <h3>Room details</h3>
        <p><strong>Room ID:</strong> {{ token }}</p>

        <h4 v-if="enabledRulesInfo.length > 0">Pre-defined rules</h4>
        <ul v-if="enabledRulesInfo.length > 0">
          <li v-for="rule in enabledRulesInfo" :key="rule.id">
            <strong>{{ rule.name }}</strong
            >: {{ rule.description }}
          </li>
        </ul>

        <h4 v-if="answerCheckInfo.length > 0">Answer checks</h4>
        <ul v-if="answerCheckInfo.length > 0">
          <li v-for="check in answerCheckInfo" :key="check.type">
            <strong>{{ check.name }}</strong
            >: {{ check.description }}
          </li>
        </ul>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
} from "vue";
import { useRouter } from "vue-router";

import api from "@/services/api";
import socket from "@/socket";
import PuzzleArea from "@/components/PuzzleArea.vue";
import BaseModal from "@/components/BaseModal.vue";

import ChatRoom from "@/components/ChatRoom.vue";
import type ChatState from "@/models/ChatState";
import {
  applyEditMessage,
  getAnswerCheckListFromTypes,
  getEnabledRulesList,
  toEditMessage,
  type EditMessage,
  type GameData,
  hasWon as checkWin,
} from "@puzzpals/puzzle-models";

const router = useRouter();

const gameData: Ref<GameData | null> = ref(null);
let hasWon = false;

const chatState: Ref<ChatState> = ref({ messages: [] });
const chatComponent = ref<InstanceType<typeof ChatRoom> | null>(null);
const showRoomDetails = ref(false);

const userID = ref<string | null>(null);
const props = defineProps({
  token: { type: String, required: true },
});

const enabledRulesInfo = computed(() => {
  if (gameData.value === null) {
    return [];
  }

  return getEnabledRulesList(gameData.value.puzzle);
});

const answerCheckInfo = computed(() => {
  if (gameData.value?.puzzle.solution === undefined) {
    return [];
  }

  return getAnswerCheckListFromTypes(
    gameData.value.puzzle.solution.typeToCheck,
  );
});

async function checkRoomExists() {
  try {
    // Check that the room exists
    const res = await api.get(`/rooms/${props.token}/exists`);
    if (res.data.exists === false) router.push("/404");
    return res.data.exists;
  } catch (err) {
    console.error(err);
    router.push("/");
    return false;
  }
}

async function joinRoom() {
  socket.connect();
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

  checkWinCondition();
}

function checkWinCondition() {
  if (gameData.value === null) {
    return;
  }

  if (!hasWon && gameData.value.puzzle.solution !== undefined) {
    const currentSolution = gameData.value.playerSolution;
    const solutionToCheck = gameData.value.puzzle.solution;

    const win = checkWin(currentSolution, solutionToCheck);
    if (win) {
      hasWon = true;
      nextTick(() => {
        setTimeout(() => {
          alert("Win");
        }, 0);
      });
    }
  }
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
    hasWon = false;
    gameData.value = data;
    userID.value = id;

    checkWinCondition();
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
  const roomExists = await checkRoomExists();
  if (!roomExists) {
    return;
  }
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
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr);
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  background: #f7f8fb;
  overflow: hidden;
}

.puzzle-pane {
  min-width: 0;
  min-height: 0;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 12px;
  box-sizing: border-box;
  overflow: auto;
}

.info-pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.info-collapsibles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  max-height: 34%;
}

.panel {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 8px;
}

.panel summary {
  cursor: pointer;
  font-weight: 600;
}

.panel ul {
  margin: 8px 0 0;
  padding-left: 20px;
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
  flex: 1 1 auto;
  min-height: 0;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.details-modal {
  max-height: 70dvh;
  overflow: auto;
  padding-right: 6px;
}

@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .puzzle-pane {
    min-height: 48dvh;
  }

  .info-pane {
    min-height: 40dvh;
  }

  .room-id {
    display: none;
  }
}
</style>
