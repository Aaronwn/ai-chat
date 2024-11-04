export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

// 添加 Message 类型别名
export type Message = ChatMessage;

export interface ChatHistory {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt?: number;
  updatedAt?: number;
  title: string;
}