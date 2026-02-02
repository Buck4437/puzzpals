// type ChatMessage = {
//   user: string;
//   msgtext: string;
//   timestamp: number;
// };

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

function processChatMessage(raw: any): { user: string, msgtext: string, timestamp: number } | null {
  if (
      !raw || typeof raw !== 'object' || typeof raw.user !== 'string' ||
      typeof raw.msgtext !== 'string' || raw.msgtext.trim() === ''
  ) {
    return null;
  }
  return {
    user: raw.user,
    msgtext: raw.msgtext.trim(),
    timestamp: Date.now()
  };
}


export { processChatMessage };