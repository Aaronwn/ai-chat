export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatHistory {
  id: string;
  userId: string;
  messages: Message[];
  title: string;
  createdAt: number;
  updatedAt: number;
}