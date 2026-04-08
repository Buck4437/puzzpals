<template>
  <div class="chat-container">
    <div class="chat-window" ref="chatWindowRef">
      <ChatBubble
        v-for="(msg, i) in props.chatState.messages"
        :key="i"
        :msg="msg"
        :currentUserID="props.userID"
      />
    </div>
    <form class="chat-input" @submit.prevent="send">
      <div class="input-area">
        <input
          v-model="input"
          type="text"
          @input="onInput"
          placeholder="Type a message..."
          autocomplete="off"
          :maxlength="MESSAGE_LIMIT"
        />
        <div
          class="remaining-count"
          :class="{
            exhausted: remainingChars === 0,
            'show-count': showRemainingCount,
          }"
        >
          {{ remainingChars }}
        </div>
      </div>
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import type { ChatMessage } from "@/models/ChatState";
import ChatBubble from "@/components/ChatBubble.vue";

const props = defineProps<{
  chatState: { messages: ChatMessage[] };
  userID: string | null;
}>();
const emit = defineEmits(["sendMessage"]);
const input = ref("");
const chatWindowRef = ref<HTMLElement | null>(null);
const MESSAGE_LIMIT = 1000;
const remainingChars = computed(() => MESSAGE_LIMIT - input.value.length);
const showRemainingCount = computed(() => remainingChars.value <= 200);

defineExpose({ scrollToBottom });

function onInput() {
  if (input.value.length > MESSAGE_LIMIT) {
    input.value = input.value.slice(0, MESSAGE_LIMIT);
  }
}

function send() {
  const text = input.value.trim();
  if (text) {
    emit("sendMessage", text);
    input.value = "";
  }
}

function scrollToBottom() {
  nextTick(() => {
    const cW = chatWindowRef.value;
    if (cW) {
      cW.scrollTop = cW.scrollHeight;
    }
  });
}
</script>

<style scoped>
.chat-container {
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-window {
  flex: 1 1 auto;
  height: 300px;
  overflow-y: auto;
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 8px;
  align-items: flex-end;
}

.input-area {
  flex-grow: 1;
  min-width: 100px;
  display: flex;
  gap: 4px;
}

.chat-input input {
  padding: 6px 8px;
  border-radius: 4px;
  min-height: 24px;
  height: 100%;
  border: 1px solid #ccc;
  text-align: left;
  flex-grow: 1;
}

.remaining-count {
  align-self: flex-end;
  visibility: hidden;
  font-size: 12px;
  color: #666;
  line-height: 1;
  width: 24px;
}

.remaining-count.show-count {
  visibility: visible;
}

.remaining-count.exhausted {
  color: #d93025;
  font-weight: 700;
}

.chat-input button {
  padding: 6px 12px;
  border-radius: 4px;
  height: 100%;
  min-width: 75px;
  border: none;
  background: #26cda9;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}
</style>
