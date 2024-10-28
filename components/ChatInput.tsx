'use client'

import { useState, Dispatch, SetStateAction } from 'react'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInputProps {
  onNewMessage: (message: Message) => void;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export default function ChatInput({ onNewMessage, messages, setMessages }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    onNewMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // 创建一个新的消息对象
      const aiMessage: Message = {
        role: 'assistant',
        content: ''
      };
      onNewMessage(aiMessage);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = ''; // 用于累积所有内容

      // 使用 requestAnimationFrame 来实现平滑的打字机效果
      const updateContent = async () => {
        try {
          const { done, value } = await reader.read();

          if (done) {
            setIsLoading(false);
            return;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line.length > 6) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  // 累积新内容
                  accumulatedContent += data.content;
                  // 更新最后一条消息的内容
                  setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = accumulatedContent;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE message:', e);
              }
            }
          }

          // 继续读取下一个数据块
          requestAnimationFrame(updateContent);
        } catch (error) {
          console.error('Error reading stream:', error);
          setIsLoading(false);
        }
      };

      // 开始读取流
      requestAnimationFrame(updateContent);

    } catch (error: any) {
      console.error('Error calling API:', error);
      onNewMessage({
        role: 'assistant',
        content: `抱歉，发生了错误：${error.message}`
      });
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入消息..."
        className="w-full p-4 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none disabled:opacity-50"
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        )}
      </button>
    </form>
  )
}
