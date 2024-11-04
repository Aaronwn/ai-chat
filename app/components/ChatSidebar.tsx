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
  const [isExpanded, setIsExpanded] = useState(true); // 控制侧边栏展开/收起
  const [showTooltip, setShowTooltip] = useState(false); // 控制提示显示
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
      <div className={`bg-gray-50 border-r transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}>
        <div className="animate-pulse p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gray-50 border-r transition-all duration-300 flex flex-col ${
        isExpanded ? 'w-64' : 'w-16'
      }`}>
        {/* 顶部工具栏 */}
        <div className="p-4 border-b flex items-center">
          <div className="relative">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-300 ${
                  !isExpanded ? 'rotate-180' : 'rotate-0'
                }`}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.85719 3H15.1428C16.2266 2.99999 17.1007 2.99998 17.8086 3.05782C18.5375 3.11737 19.1777 3.24318 19.77 3.54497C20.7108 4.02433 21.4757 4.78924 21.955 5.73005C22.2568 6.32234 22.3826 6.96253 22.4422 7.69138C22.5 8.39925 22.5 9.27339 22.5 10.3572V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118ZM11.5 5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V10.4C20.5 9.26339 20.4992 8.47108 20.4488 7.85424C20.3994 7.24907 20.3072 6.90138 20.173 6.63803C19.8854 6.07354 19.4265 5.6146 18.862 5.32698C18.5986 5.19279 18.2509 5.10062 17.6458 5.05118C17.0289 5.00078 16.2366 5 15.1 5H11.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 7.94772 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap">
                {isExpanded ? '收起侧边栏' : '展开侧边栏'}
              </div>
            )}
          </div>
          {isExpanded && (
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
              className="ml-2 flex-1 bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600 transition-colors"
            >
              新对话
            </button>
          )}
        </div>

        {/* 聊天记录列表 */}
        <div className="flex-1 overflow-y-auto">
          {isExpanded ? (
            <div className="p-4 space-y-2">
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
          ) : (
            <div className="p-2">
              {/* 收起状态下只显示图标按钮 */}
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
                className="w-full p-2 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          )}
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