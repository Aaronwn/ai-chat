'use client'

import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInputProps {
  onNewMessage: (message: Message) => void;
  messages: Message[];
}

export default function ChatInput({ onNewMessage, messages }: ChatInputProps) {
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
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiMessage: Message = {
        role: 'assistant',
        content: data.content || '抱歉，我无法生成回复。'
      }
      onNewMessage(aiMessage)
    } catch (error) {
      console.error('Error calling API:', error)
      onNewMessage({ role: 'assistant', content: '抱歉，发生了错误。请稍后再试。' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入您的问题..."
        className="flex-grow rounded-l-lg border-2 border-gray-300 p-3 focus:border-blue-500 focus:outline-none transition-colors"
        disabled={isLoading}
      />
      <button
        type="submit"
        className={`rounded-r-lg px-6 py-3 text-white focus:outline-none transition-colors ${
          isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
        disabled={isLoading}
      >
        {isLoading ? '发送中...' : '发送'}
      </button>
    </form>
  )
}
