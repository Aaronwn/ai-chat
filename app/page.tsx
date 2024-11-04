'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送消息的核心逻辑
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    try {
      setIsLoading(true)
      // 创建新的用户消息
      const newMessage: Message = {
        role: 'user',
        content: message.trim()
      }

      // 更新消息列表，添加用户消息
      setMessages(prev => [...prev, newMessage])
      // 清空输入框
      setMessage('')

      // 准备一个临时的 assistant 消息用于流式更新
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      // 调用API发送消息
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newMessage]
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // 处理流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // 解码收到的数据
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        // 处理每一行数据
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5))
              if (data.content) {
                assistantMessage += data.content
                // 更新最后一条消息（assistant的回复）
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { role: 'assistant', content: assistantMessage }
                ])
              }
            } catch (e) {
              console.error('Error parsing SSE message:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      // 显示错误消息
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '抱歉，发生了错误，请稍后重试。' }
      ])
    } finally {
      setIsLoading(false)
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
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
                  {msg.content || (isLoading && '...')}
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
              placeholder="输入消息..."
              rows={1}
              disabled={isLoading}
              className="w-full resize-none px-4 py-3 pr-16 max-h-36 overflow-y-auto bg-transparent border-0 focus:ring-0 focus:outline-none disabled:opacity-50"
              style={{
                minHeight: '44px',
                maxHeight: '200px'
              }}
            />
            <button
              type="submit"
              className={`absolute right-2 bottom-2 p-1 ${
                message.trim() && !isLoading
                  ? 'text-blue-500 hover:text-blue-600'
                  : 'text-gray-300'
              } transition-colors`}
              disabled={!message.trim() || isLoading}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 transform rotate-90"
                fill="currentColor"
              >
                <path d="M 12 2 L 4 22 L 12 19 L 20 22 Z" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 px-2 text-center">
            按 Enter 发送消息，按 Shift + Enter 换行
          </div>
        </form>
      </div>
    </div>
  )
}
