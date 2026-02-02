<template>
  <div :class="['chat-message', isMine ? 'my-message' : 'other-message']">
    <div class="bubble">
      <div class="chat-header">{{ msg.user }}</div>
      <div class="chat-text">{{ msg.msgtext }}</div>
      <div class="chat-footer">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/models/ChatState';
import { computed } from 'vue';

const props = defineProps<{ msg: ChatMessage, currentUserID: string | null }>();

const isMine = computed(() => props.currentUserID === props.msg.user);

const formattedTime = computed(() => {
  return new Date(props.msg.timestamp).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  });
});
</script>

<style scoped>
.chat-message {
  display: flex;
  flex-direction: row;
  margin-bottom: 4px;
}
.my-message {
  justify-content: flex-end;
}
.other-message {
  justify-content: flex-start;
}
.bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 16px;
  background: #d1f7e7;
  color: #222;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  word-break: break-word;
}
.my-message .bubble {
  background: #26cda9;
  color: #fff;
  align-items: flex-end;
}
.other-message .bubble {
  background: #f1f1f1;
  color: #222;
  align-items: flex-start;
}

.my-message > .bubble > .chat-header {
  color: #e0fff6;
}

.other-message > .bubble > .chat-header {
  color: #555;
}

.chat-header {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 2px;
}
.chat-text {
  font-size: 15px;
  margin-bottom: 4px;
}
.chat-footer {
  font-size: 11px;
  color: #888;
  align-self: flex-end;
}
</style>


<!-- <template>
    <div class="bubble" :class="{ 'my-message': isMine, 'other-message': !isMine }">
        <div class="chat-header">{{ msg.user }}</div>
        <div class="chat-text">{{ msg.msgtext }}</div>
        <div class="chat-footer">{{ formattedTime }}</div>
    </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/models/ChatState';
import { computed } from 'vue';

const props = defineProps<{ msg: ChatMessage, currentUserID: string | null }>();

const isMine = computed(() => props.currentUserID === props.msg.user);

const formattedTime = computed(() => {
    return new Date(props.msg.timestamp).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
    });
});
</script>

<style scoped>
.bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 16px;
  background: #d1f7e7;
  color: #222;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  word-break: break-word;
}
.my-message {
  background: #26cda9;
  color: #fff;
  align-items: flex-end;
}
.other-message {
  background: #f1f1f1;
  color: #222;
  align-items: flex-start;
}
.chat-header {
  font-weight: bold;
  font-size: 12px;
  color: #555;
  margin-bottom: 2px;
}
.chat-text {
  font-size: 15px;
  margin-bottom: 4px;
}
.chat-footer {
  font-size: 11px;
  color: #888;
  align-self: flex-end;
}
</style> -->