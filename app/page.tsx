'use client'

import { useState } from 'react'
import ChatInput from '@/components/ChatInput'
import AIChatHistory from '@/components/AIChatHistory'
import FeatureList from '@/components/FeatureList'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])

  const handleNewMessage = (message: Message) => {
    setMessages(prevMessages => [...prevMessages, message])
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-50">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">AI聊天助手</h1>
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <AIChatHistory messages={messages} />
          <div className="mt-4">
            <ChatInput onNewMessage={handleNewMessage} messages={messages} />
          </div>
        </div>
        <FeatureList />
      </div>
    </main>
  )
}
