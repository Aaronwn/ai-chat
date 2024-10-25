'use client'

import { useState } from 'react'
import ChatInput from '../components/ChatInput'
import AIChatHistory from '../components/AIChatHistory'

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
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white border-b border-gray-200 p-3">
        <h1 className="text-lg font-semibold text-gray-800 text-center">AI聊天助手</h1>
      </header>
      <main className="flex-grow overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          <AIChatHistory messages={messages} />
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 p-3">
        <div className="max-w-3xl mx-auto">
          <ChatInput onNewMessage={handleNewMessage} messages={messages} />
        </div>
      </footer>
    </div>
  )
}
