export default interface ChatState {
  messages: ChatMessage[];
}

export interface ChatMessage {
  user: string;
  msgtext: string;
  timestamp: number;
}

