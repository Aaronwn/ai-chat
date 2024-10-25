import React from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatHistoryProps {
  messages: Message[];
}

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg ${
            message.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'
          }`}
        >
          <p className="text-sm font-semibold mb-1">
            {message.role === 'user' ? '你' : 'AI助手'}
          </p>
          <p>{message.content}</p>
        </div>
      ))}
    </div>
  );
};

export default AIChatHistory;
