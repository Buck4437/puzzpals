<template>
  <div v-if="!gameData">Joining room...</div>
  <div v-else>
    <h2>Room {{ token }}</h2>
    <button @click="leaveRoom">Leave</button>
    <div v-if="enabledRulesInfo.length > 0">
      <h3>Pre-defined rules</h3>
      <ul>
        <li v-for="rule in enabledRulesInfo" :key="rule.id">
          <strong>{{ rule.name }}</strong
          >: {{ rule.description }}
        </li>
      </ul>
    </div>
    <div v-if="answerCheckInfo.length > 0">
      <h3>Answer checks</h3>
      <ul>
        <li v-for="check in answerCheckInfo" :key="check.type">
          <strong>{{ check.name }}</strong
          >: {{ check.description }}
        </li>
      </ul>
    </div>
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

import Chat from "@/components/Chat.vue";
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
const chatComponent = ref<InstanceType<typeof Chat> | null>(null);

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
  await checkRoomExists();
  console.log(`Joining room ${props.token}`);
  await joinRoom();
});

onBeforeUnmount(() => {
  socket.disconnect();
  socket.off();
});
</script>
