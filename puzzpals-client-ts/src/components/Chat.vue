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
      <input v-model="input" type="text" placeholder="Type a message..." autocomplete="off" />
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { ChatMessage } from '@/models/ChatState';
import ChatBubble from './ChatBubble.vue';

const props = defineProps<{ chatState: { messages: ChatMessage[] }, userID: string | null }>();
const emit = defineEmits(['newMessage']);
const input = ref('');
const chatWindowRef = ref<HTMLElement | null>(null);

defineExpose({ scrollToBottom });

function send() {
  const text = input.value.trim();
  if (text) {
    const message = {
      user: "",
      msgtext: text,
      timestamp: 0
    };
    console.log(message)
    emit('newMessage', message);
    input.value = '';
  }
}

function scrollToBottom() {
  nextTick(() => {
    const cW = chatWindowRef.value;
    if (cW) { cW.scrollTop = cW.scrollHeight; }
  });
}

</script>

<style scoped>
.chat-container {
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 320px;
  max-width: 100%;
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
}

.chat-input input {
  flex: 1 1 auto;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.chat-input button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background: #26cda9;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}
</style>
<!-- <template>
  <div class="chat-container">
    <div class="chat-window" ref="chatWindowRef">
      <div v-for="(msg, i) in props.chatState.messages" :key="i" class="chat-message">
        <ChatBubble :msg="msg" :currentUserID="props.userID" />
      </div>
    </div>
    <form class="chat-input" @submit.prevent="send">
      <input v-model="input" type="text" placeholder="Type a message..." autocomplete="off" />
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { ChatMessage } from '@/models/ChatState';
import ChatBubble from './ChatBubble.vue';

const props = defineProps<{ chatState: { messages: ChatMessage[] }, userID: string | null }>();
const emit = defineEmits(['newMessage']);
const input = ref('');
const chatWindowRef = ref<HTMLElement | null>(null);

defineExpose({ scrollToBottom });

function send() {
  const text = input.value.trim();
  if (text) {
    const message = {
      user: "",
      msgtext: text,
      timestamp: 0
    };
    console.log(message)
    emit('newMessage', message);
    input.value = '';
  }
}

function scrollToBottom() {
  nextTick(() => {
    const cW = chatWindowRef.value;
    if (cW) { cW.scrollTop = cW.scrollHeight; }
  });
}

</script>

<style scoped>
.chat-container {
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 320px;
  max-width: 100%;
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

.chat-message {
  display: flex;
  flex-direction: row;
  margin-bottom: 4px;
}

/* .my-message {
  justify-content: flex-end;
}

.other-message {
  justify-content: flex-start;
} */

.chat-input {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.chat-input input {
  flex: 1 1 auto;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.chat-input button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background: #26cda9;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}
</style> -->