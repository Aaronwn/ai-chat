"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChatHistory } from '../../types/chat';
import { getChatHistories, deleteChatHistory, updateChatHistory } from '../../lib/firestore';
import ConfirmDialog from './ConfirmDialog';

interface ChatSidebarProps {
  onSelectChat: (chat: ChatHistory) => void;
  currentChatId?: string;
  onNewChat?: () => void;
  shouldRefresh?: number;
}

export default function ChatSidebar({
  onSelectChat,
  currentChatId,
  onNewChat,
  shouldRefresh
}: ChatSidebarProps) {
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptionsFor, setShowOptionsFor] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    chatId: string;
    title: string;
  }>({ isOpen: false, chatId: '', title: '' });
  const { user } = useAuth();

  // 加载聊天历史
  const loadHistories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const chatHistories = await getChatHistories(user.uid);
      setHistories(chatHistories.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      console.error('Error loading chat histories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistories();
  }, [user, shouldRefresh]);

  // 处理重命名
  const handleRename = async (chatId: string) => {
    if (!newTitle.trim()) return;

    try {
      const chat = histories.find(h => h.id === chatId);
      if (!chat) return;

      // 先在本地更新状态
      setHistories(prevHistories =>
        prevHistories.map(h =>
          h.id === chatId
            ? { ...h, title: newTitle.trim() }
            : h
        )
      );

      // 然后在后台更新数据库
      await updateChatHistory(chatId, chat.messages, newTitle.trim());
    } catch (error) {
      console.error('Error renaming chat:', error);
      // 如果更新失败，重新加载历史记录以恢复正确状态
      loadHistories();
    } finally {
      setIsRenaming(null);
      setNewTitle('');
    }
  };

  // 处理删除
  const handleDelete = async (chatId: string) => {
    try {
      await deleteChatHistory(chatId);
      setShowOptionsFor(null);
      setDeleteConfirm({ isOpen: false, chatId: '', title: '' });

      // 在本地更新状态
      setHistories(prevHistories =>
        prevHistories.filter(h => h.id !== chatId)
      );
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-50 border-r p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-gray-50 border-r overflow-y-auto">
        <div className="p-4">
          <button
            onClick={() => {
              onSelectChat({
                id: 'new',
                userId: user?.uid || '',
                messages: [],
                title: '新对话',
                createdAt: Date.now(),
                updatedAt: Date.now()
              });
              onNewChat?.();
            }}
            className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 transition-colors mb-4"
          >
            新对话
          </button>

          <div className="space-y-2">
            {histories.map((chat) => (
              <div
                key={chat.id}
                className="relative group"
                onMouseLeave={() => setShowOptionsFor(null)}
              >
                {isRenaming === chat.id ? (
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={chat.title}
                    className="w-full p-3 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(chat.id);
                      } else if (e.key === 'Escape') {
                        setIsRenaming(null);
                        setNewTitle('');
                      }
                    }}
                    onBlur={() => {
                      setIsRenaming(null);
                      setNewTitle('');
                    }}
                  />
                ) : (
                  <button
                    onClick={() => onSelectChat(chat)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    } flex items-center justify-between`}
                  >
                    <div className="font-medium truncate flex-1">{chat.title}</div>
                    <div
                      className="opacity-0 group-hover:opacity-100 relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptionsFor(chat.id);
                      }}
                    >
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                          <circle cx="8" cy="2" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="14" r="1.5" />
                        </svg>
                      </button>

                      {showOptionsFor === chat.id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border py-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsRenaming(chat.id);
                              setNewTitle(chat.title);
                              setShowOptionsFor(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            重命名
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                isOpen: true,
                                chatId: chat.id,
                                title: chat.title
                              });
                              setShowOptionsFor(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="删除对话"
        message={`确定要删除这个对话吗？`}
        onConfirm={() => handleDelete(deleteConfirm.chatId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, chatId: '', title: '' })}
      />
    </>
  );
}