<template>
  <div class="solving-page">
    <header class="top-bar">
      <h1>Puzzpals</h1>
      <span class="room-id">Room ID: ABCDEFGH</span>
      <span> 01:00 </span>
    </header>

    <div class="content">
      <div class="puzzle-pane">
        <div class="left-inner">Puzzle goes here</div>
      </div>

      <div class="info-pane">
        <div class="player-info">Player info here</div>

        <div class="chat-con">
          <div class="bottom-inner">
            <div class="chat-history" role="log" aria-label="chat history">
              <!-- long bordered box for chat history -->
              <div class="message" v-for="(m, i) in messages" :key="i">
                {{ m }}
              </div>
            </div>

            <div class="chat-input">
              <input
                v-model="messageInput"
                @keyup.enter="send"
                type="text"
                placeholder="Enter a message..."
                aria-label="message input"
              />
              <button @click="send" aria-label="send">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SolvingPage",
  data() {
    return {
      messages: ["Sample message 1", "Sample message 2"],
      messageInput: "",
    };
  },
  methods: {
    send() {
      const text = this.messageInput && this.messageInput.trim();
      if (text === "") return;
      this.messages.push(text);
      this.messageInput = "";
      // Keep history scrolled to bottom
      requestAnimationFrame(() => {
        const el = document.querySelector(".chat-history");
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
  },
};
</script>

<style scoped>
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

.bottom-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.chat-history {
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  padding: 8px;
  background: #ffffff;
  flex: 1 1 auto;
  overflow-y: auto;
  margin-bottom: 8px;
}

.message {
  padding: 6px 8px;
  border-radius: 4px;
  background: #f1f3fb;
  margin-bottom: 6px;
  font-size: 13px;
}

.chat-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Input stretches, button small to the right */
.chat-input input[type="text"] {
  flex: 1 1 auto;
  padding: 8px 10px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.chat-input button {
  flex: 0 0 auto;
  padding: 8px 12px;
  background: #42cbf5;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  height: 38px;
}

.chat-input button:active {
  transform: translateY(1px);
}

@media (max-width: 800px) {
  /* stack right under left on small screens */
  .content {
    flex-direction: column;
  }
  .left-pane,
  .right-pane {
    flex: 0 0 auto;
    width: 100%;
  }
  .right-pane {
    flex-direction: column;
  }
  .right-top,
  .right-bottom {
    flex: none;
    height: 200px;
  }
}
</style>
