<template>
  <div v-if="!gameData" class="joining-text">Joining room {{ token }}...</div>
  <div v-else>
    <div class="solving-page">
      <TopBar @title-click="goToHome">
        <template #middle>
          <div class="room-id">Room ID: {{ props.token }}</div>
        </template>
        <template #right>
          <div class="header-actions">
            <button @click="showPuzzleInfoModal = true">
              Pre-defined rules / Answer check info
            </button>
          </div>
        </template>
      </TopBar>

      <div class="content">
        <div class="puzzle-pane">
          <PuzzleArea
            class="puzzle-area"
            :grid="gameData.puzzle"
            :player-solution="gameData.playerSolution"
            @edit-message="onGridEdited"
          />
        </div>

        <div class="info-pane">
          <div class="rule-pane">
            <h3>{{ gameData.puzzle.title || "Untitled Puzzle" }}</h3>
            <p class="rule-description" style="white-space: pre-line">
              {{ gameData.puzzle.description || "No description provided." }}
            </p>
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
  </div>

  <BaseModal
    v-if="showPuzzleInfoModal && gameData"
    @close="showPuzzleInfoModal = false"
  >
    <template v-if="enabledRulesInfo.length > 0">
      <p v-if="enabledRulesInfo.length > 0">
        Pre-defined rules ({{ enabledRulesInfo.length }})
      </p>
      <ul>
        <li v-for="rule in enabledRulesInfo" :key="rule.id">
          <strong>{{ rule.name }}</strong
          >: {{ rule.description }}
        </li>
      </ul>
    </template>
    <p v-else>No pre-defined rules enabled for this puzzle.</p>

    <template v-if="answerCheckInfo.length > 0">
      <p v-if="answerCheckInfo.length > 0">
        Answer checks <span>({{ answerCheckInfo.length }})</span>
      </p>
      <ul>
        <li v-for="check in answerCheckInfo" :key="check.type">
          <strong>{{ check.name }}</strong
          >: {{ check.description }}
        </li>
      </ul>
    </template>
    <p v-else>No answer checks defined for this puzzle.</p>
  </BaseModal>
  <BaseModal v-if="showSolvedModal" @close="showSolvedModal = false">
    <h3>Puzzle solved!</h3>
    <button class="win-modal-btn" @click="showSolvedModal = false">Yay!</button>
  </BaseModal>
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
import TopBar from "@/components/TopBar.vue";

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
const showPuzzleInfoModal = ref(false);
const showSolvedModal = ref(false);

const chatState: Ref<ChatState> = ref({ messages: [] });
const chatComponent = ref<InstanceType<typeof ChatRoom> | null>(null);

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

function goToHome() {
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
        showSolvedModal.value = true;
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
    showPuzzleInfoModal.value = false;
    showSolvedModal.value = false;
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
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.room-id {
  font-size: 0.95rem;
  color: #304868;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.puzzle-area {
  width: 100%;
  height: 100%;
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

.rule-pane {
  background: #fff;
  border-radius: 6px;
  max-height: 30%;
  padding: 8px;
  flex: 0 0 auto;
  gap: 12px;
  overflow: auto;
}

.rule-pane h3 {
  margin: 0;
}

.rule-pane p {
  margin-bottom: 0;
  word-break: break-word;
}

.chat-con {
  background: #fff;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex: 1 1;
  box-sizing: border-box;
  align-items: stretch;
  overflow: hidden;
}

.win-modal-btn {
  background-color: rgb(158, 247, 244);
  padding: 8px 16px;
  font-size: 1rem;
}

.win-modal-btn:hover {
  background-color: rgb(138, 219, 216);
}
</style>
