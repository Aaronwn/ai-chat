'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ChatSidebar from './components/ChatSidebar'
import { ChatHistory, Message, ChatMessage } from '../types/chat'
import { saveChatHistory, updateChatHistory } from '../lib/firestore'

export default function Home() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null)
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [refreshKey, setRefreshKey] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    setMessages([])
    setCurrentChat(null)
  }, [user?.uid])

  // 处理选择聊天记录
  const handleSelectChat = (chat: ChatHistory) => {
    if (chat.id === 'new') {
      setMessages([])
      setCurrentChat(null)
    } else {
      setMessages(chat.messages)
      setCurrentChat(chat)
    }
  }

  // 保存或更新聊天记录
  const saveChat = async (messages: Message[]) => {
    if (!user) return

    try {
      if (currentChat && currentChat.id !== 'new') {
        // 更新现有聊天
        await updateChatHistory(currentChat.id, messages)
      } else {
        // 创建新聊天
        const chatId = await saveChatHistory(user.uid, messages)
        const newChat: ChatHistory = {
          id: chatId,
          userId: user.uid,
          messages,
          title: messages[0]?.content.slice(0, 50) || '新对话',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        setCurrentChat(newChat)
      }
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error saving chat:', error)
    }
  }

  // 中断请求的函数
  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // 发送消息的核心逻辑
  const sendMessage = async () => {
    if (!message.trim() || isLoading || !user) return

    try {
      setIsLoading(true)
      const controller = new AbortController()
      setAbortController(controller)

      const newMessage: Message = {
        role: 'user',
        content: message.trim(),
        timestamp: Date.now()
      }

      const newMessages = [...messages, newMessage]
      setMessages(newMessages)
      setMessage('')

      const tempAssistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }
      setMessages([...newMessages, tempAssistantMessage])

      const apiMessages: ChatMessage[] = newMessages.map(({ role, content }) => ({
        role,
        content
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages
        }),
        signal: controller.signal
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to send message')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5))
              if (data.content) {
                assistantMessage += data.content
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  {
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: Date.now()
                  }
                ])
              }
            } catch (e) {
              console.error('Error parsing SSE message:', e)
            }
          }
        }
      }

      const finalMessages: Message[] = [...newMessages, {
        role: 'assistant',
        content: assistantMessage,
        timestamp: Date.now()
      }]
      setMessages(finalMessages)
      await saveChat(finalMessages)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 请求被中断，不需要显示错误消息
        return
      }
      console.error('Error sending message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，发生了错误，请稍后重试。',
          timestamp: Date.now()
        }
      ])
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // 阻止默认的换行行为
      sendMessage()
    }
  }

  // 处理文本框内容变化，自动调整高度
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setMessage(textarea.value)

    // 自动调整高度
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  // 自定义代码块渲染组件
  const CodeBlock = ({ language, value }: { language: string, value: string }) => {
    return (
      <div className="rounded-md overflow-hidden my-2">
        <SyntaxHighlighter
          language={language}
          style={tomorrow}
          customStyle={{
            margin: 0,
            borderRadius: '0.375rem',
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {user ? (
        <>
          <ChatSidebar
            onSelectChat={handleSelectChat}
            currentChatId={currentChat?.id}
            shouldRefresh={refreshKey}
            onNewChat={() => setMessages([])}
          />

          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-auto p-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <CodeBlock
                                language={match[1]}
                                value={String(children).replace(/\n$/, '')}
                              />
                            ) : (
                              <code className="bg-gray-200 rounded px-1 py-0.5" {...props}>
                                {children}
                              </code>
                            )
                          },
                          // 自定义其他 Markdown 元素的样式
                          p: ({ children }) => <p className="mb-2">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold mb-3">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-bold mb-2">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-bold mb-2">{children}</h3>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic">
                              {children}
                            </blockquote>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {children}
                            </a>
                          ),
                        }}
                        className="prose prose-sm max-w-none"
                      >
                        {`${msg.content || (isLoading ? '...' : '')}`}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t bg-white px-4 py-4">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative flex items-end bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.1)] border">
                  <textarea
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息... (Enter 发送, Shift + Enter 换行)"
                    rows={1}
                    disabled={isLoading}
                    className="w-full resize-none px-4 py-3 pr-16 max-h-36 overflow-y-auto bg-transparent border-0 focus:ring-0 focus:outline-none disabled:opacity-50 placeholder:text-gray-400 placeholder:text-sm"
                    style={{
                      minHeight: '44px',
                      maxHeight: '200px'
                    }}
                  />
                  <button
                    type={isLoading ? 'button' : 'submit'}
                    onClick={isLoading ? handleAbort : undefined}
                    className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${
                      isLoading
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        : message.trim()
                        ? 'text-white bg-blue-500 hover:bg-blue-600'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!isLoading && !message.trim()}
                  >
                    {isLoading ? (
                      // 优化的停止图标
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      </svg>
                    ) : (
                      // 优化的发送图标
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="currentColor"
                        stroke="none"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>请登录后开始聊天</p>
          </div>
        </div>
      )}
    </div>
  )
}
