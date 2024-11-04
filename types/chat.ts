export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface ChatHistory {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  title: string;
}