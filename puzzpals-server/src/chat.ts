// const chatRecords = new Map<string, ChatMessage[]>();

// function fetchChatRecords(token: string) {
//   return chatRecords.get(token) || [];
// }

// function pushMessage(token: string, message: ChatMessage) {
//   if (!chatRecords.has(token)) {
//     chatRecords.set(token, []);
//   }
//   chatRecords.get(token)!.push(message);
// }

interface RawChatMessage {
  user: string;
  msgtext: string;
}

interface ChatMessage {
  user: string;
  msgtext: string;
  timestamp: number;
}

function isMessageValid(raw: unknown): raw is RawChatMessage {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "user" in raw &&
    typeof raw.user === "string" &&
    "msgtext" in raw &&
    typeof raw.msgtext === "string" &&
    raw.msgtext.trim() !== ""
  );
}

function processChatMessage(raw: unknown): ChatMessage | null {
  if (isMessageValid(raw)) {
    return {
      user: raw.user,
      msgtext: raw.msgtext.trim(),
      timestamp: Date.now(),
    };
  }
  return null;
}

export { processChatMessage };
